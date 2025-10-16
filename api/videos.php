
<?php
// ✅ OTIMIZAÇÃO: Compressão GZIP e cache
ob_start("ob_gzhandler");

// Headers CORS - DEVE VIR ANTES DE QUALQUER OUTPUT
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisições OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

// ✅ OTIMIZAÇÃO: Sistema de cache para consultas GET
function getCachedData($cacheFile, $cacheTime = 300) {
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
        return file_get_contents($cacheFile);
    }
    return false;
}

function setCachedData($cacheFile, $data) {
    file_put_contents($cacheFile, $data);
}

try {
    $db = new Database();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            handleGet($db, $action);
            break;
        case 'POST':
            handlePost($db, $action);
            break;
        case 'PUT':
            handlePut($db, $action);
            break;
        case 'DELETE':
            handleDelete($db, $action);
            break;
        default:
            jsonError('Método não permitido', 405);
    }
} catch (Exception $e) {
    error_log("Erro na API de vídeos: " . $e->getMessage());
    jsonError('Erro interno do servidor', 500);
}

function handleGet($db, $action) {
    switch ($action) {
        case 'all':
            getAllVideos($db);
            break;
        case 'by-id':
            getVideoById($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePost($db, $action) {
    switch ($action) {
        case 'create':
            createVideo($db);  // ✅ ADICIONADO
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePut($db, $action) {
    switch ($action) {
        case 'update':
            updateVideo($db);  // ✅ ADICIONADO
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handleDelete($db, $action) {
    switch ($action) {
        case 'delete':
            deleteVideo($db);  // ✅ ADICIONADO
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function getAllVideos($db) {
    try {
        // ✅ OTIMIZAÇÃO: Cache de 5 minutos para consulta de todos os vídeos
        $cacheFile = __DIR__ . '/cache_videos.json';
        $cacheTime = 300; // 5 minutos
        
        $cachedData = getCachedData($cacheFile, $cacheTime);
        if ($cachedData !== false) {
            echo $cachedData;
            return;
        }
        
        // Atualizar status "NOVO" antes de retornar
        updateNewStatus($db);
        
        // CORRIGIDO: Usar position_number em vez de order_number
        $sql = "SELECT id, title, description, video_url, thumbnail_url, position_number as order_number, created_at, is_new, new_until, testament FROM videos ORDER BY position_number ASC";
        $result = $db->query($sql);
        
        $videos = [];
        while ($row = $result->fetch_assoc()) {
            $row['is_new'] = (bool)$row['is_new'];
            $videos[] = $row;
        }
        
        $jsonData = json_encode(['data' => $videos], JSON_UNESCAPED_UNICODE);
        setCachedData($cacheFile, $jsonData);
        
        echo $jsonData;
    } catch (Exception $e) {
        error_log("Erro ao buscar vídeos: " . $e->getMessage());
        jsonError('Erro ao buscar vídeos: ' . $e->getMessage(), 500);
    }
}

function getVideoById($db) {
    try {
        $id = $_GET['id'] ?? '';
        
        if (empty($id)) {
            jsonError('ID é obrigatório');
        }
        
        // ✅ OTIMIZAÇÃO: Cache individual por vídeo
        $cacheFile = __DIR__ . "/cache_video_{$id}.json";
        $cacheTime = 300; // 5 minutos
        
        $cachedData = getCachedData($cacheFile, $cacheTime);
        if ($cachedData !== false) {
            echo $cachedData;
            return;
        }
        
        // CORRIGIDO: Usar position_number em vez de order_number
        $sql = "SELECT id, title, description, video_url, thumbnail_url, position_number as order_number, created_at, is_new, new_until, testament FROM videos WHERE id = ?";
        $result = $db->query($sql, [$id]);
        
        if ($result->num_rows === 0) {
            jsonResponse(['data' => null]);
            return;
        }
        
        $video = $result->fetch_assoc();
        $video['is_new'] = (bool)$video['is_new'];
        
        $jsonData = json_encode(['data' => $video], JSON_UNESCAPED_UNICODE);
        setCachedData($cacheFile, $jsonData);
        
        echo $jsonData;
    } catch (Exception $e) {
        error_log("Erro ao buscar vídeo: " . $e->getMessage());
        jsonError('Erro ao buscar vídeo: ' . $e->getMessage(), 500);
    }
}

function createVideo($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        $video_url = $input['video_url'] ?? '';
        $thumbnail_url = $input['thumbnail_url'] ?? '';
        $order_number = $input['order_number'] ?? null;
        $is_new = $input['is_new'] ?? true; // 🔧 CORRIGIDO: Por padrão NOVO
        $testament = $input['testament'] ?? 'old';
        
        if (empty($title) || empty($video_url)) {
            jsonError('Título e URL do vídeo são obrigatórios');
        }
        
        // 🔧 CORRIGIDO: Calcular automaticamente o próximo número de ordem se não fornecido
        if ($order_number === null || $order_number <= 0) {
            $maxOrderSql = "SELECT MAX(position_number) as max_order FROM videos";
            $maxResult = $db->query($maxOrderSql);
            $maxRow = $maxResult->fetch_assoc();
            $order_number = ($maxRow['max_order'] ?? 0) + 1;
        }
        
        // Reorganizar vídeos existentes se necessário (apenas se order_number específico foi fornecido)
        if ($input['order_number'] ?? null) {
            $updateOrderSql = "UPDATE videos SET position_number = position_number + 1 WHERE position_number >= ?";
            $db->update($updateOrderSql, [$order_number]);
        }
        
        // 🔧 CORRIGIDO: Calcular data de expiração do "NOVO" (30 dias a partir de hoje) sempre que is_new for true
        $new_until = null;
        if ($is_new) {
            $new_until = date('Y-m-d H:i:s', strtotime('+30 days'));
        }
        
        // 🔧 CORRIGIDO: Garantir que position_number sempre tenha um valor
        $sql = "INSERT INTO videos (title, description, video_url, thumbnail_url, position_number, is_new, new_until, testament) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $videoId = $db->insert($sql, [$title, $description, $video_url, $thumbnail_url, $order_number, $is_new, $new_until, $testament]);
        
        // ✅ OTIMIZAÇÃO: Limpar cache após modificação
        clearVideosCache();
        
        // Buscar vídeo criado
        $getVideoSql = "SELECT id, title, description, video_url, thumbnail_url, position_number as order_number, created_at, is_new, new_until, testament FROM videos WHERE id = ?";
        $result = $db->query($getVideoSql, [$videoId]);
        $video = $result->fetch_assoc();
        
        $video['is_new'] = (bool)$video['is_new'];
        
        jsonResponse(['data' => $video]);
    } catch (Exception $e) {
        error_log("Erro ao criar vídeo: " . $e->getMessage());
        jsonError('Erro ao criar vídeo: ' . $e->getMessage(), 500);
    }
}

function updateVideo($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $id = $input['id'] ?? '';
        
        if (empty($id)) {
            jsonError('ID é obrigatório');
        }
        
        // Verificar se vídeo existe - CORRIGIDO: Usar position_number
        $checkSql = "SELECT id, position_number FROM videos WHERE id = ?";
        $checkResult = $db->query($checkSql, [$id]);
        
        if ($checkResult->num_rows === 0) {
            jsonError('Vídeo não encontrado');
        }
        
        $currentVideo = $checkResult->fetch_assoc();
        $currentOrder = $currentVideo['position_number'];
        
        // Construir query de update dinamicamente
        $updateFields = [];
        $params = [];
        
        if (isset($input['title'])) {
            $updateFields[] = "title = ?";
            $params[] = $input['title'];
        }
        if (isset($input['description'])) {
            $updateFields[] = "description = ?";
            $params[] = $input['description'];
        }
        if (isset($input['video_url'])) {
            $updateFields[] = "video_url = ?";
            $params[] = $input['video_url'];
        }
        if (isset($input['thumbnail_url'])) {
            $updateFields[] = "thumbnail_url = ?";
            $params[] = $input['thumbnail_url'];
        }
        if (isset($input['order_number']) && $input['order_number'] != $currentOrder) {
            $newOrder = $input['order_number'];
            
            // Reorganizar outros vídeos - CORRIGIDO: Usar position_number
            if ($newOrder > $currentOrder) {
                // Movendo para baixo: decrementar vídeos entre currentOrder e newOrder
                $reorderSql = "UPDATE videos SET position_number = position_number - 1 WHERE position_number > ? AND position_number <= ? AND id != ?";
                $db->update($reorderSql, [$currentOrder, $newOrder, $id]);
            } else {
                // Movendo para cima: incrementar vídeos entre newOrder e currentOrder
                $reorderSql = "UPDATE videos SET position_number = position_number + 1 WHERE position_number >= ? AND position_number < ? AND id != ?";
                $db->update($reorderSql, [$newOrder, $currentOrder, $id]);
            }
            
            $updateFields[] = "position_number = ?";
            $params[] = $newOrder;
        }
        if (isset($input['is_new'])) {
            $updateFields[] = "is_new = ?";
            $params[] = $input['is_new'];
            
            // 🔧 CORRIGIDO: Se está marcando como NOVO, definir data de expiração para 30 dias
            if ($input['is_new']) {
                $updateFields[] = "new_until = ?";
                $params[] = date('Y-m-d H:i:s', strtotime('+30 days'));
            } else {
                // Se está desmarcando, limpar a data de expiração
                $updateFields[] = "new_until = NULL";
            }
        }
        if (isset($input['testament'])) {
            $updateFields[] = "testament = ?";
            $params[] = $input['testament'];
        }
        
        if (empty($updateFields)) {
            jsonError('Nenhum campo para atualizar');
        }
        
        $params[] = $id;
        $sql = "UPDATE videos SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $db->update($sql, $params);
        
        // ✅ OTIMIZAÇÃO: Limpar cache após modificação
        clearVideosCache();
        
        // Buscar vídeo atualizado - CORRIGIDO: Usar position_number
        $getVideoSql = "SELECT id, title, description, video_url, thumbnail_url, position_number as order_number, created_at, is_new, new_until, testament FROM videos WHERE id = ?";
        $result = $db->query($getVideoSql, [$id]);
        $video = $result->fetch_assoc();
        
        $video['is_new'] = (bool)$video['is_new'];
        
        jsonResponse(['data' => $video]);
    } catch (Exception $e) {
        error_log("Erro ao atualizar vídeo: " . $e->getMessage());
        jsonError('Erro ao atualizar vídeo: ' . $e->getMessage(), 500);
    }
}

function deleteVideo($db) {
    try {
        $id = $_GET['id'] ?? '';
        
        if (empty($id)) {
            jsonError('ID é obrigatório');
        }
        
        // Verificar se vídeo existe
        $checkSql = "SELECT id FROM videos WHERE id = ?";
        $checkResult = $db->query($checkSql, [$id]);
        
        if ($checkResult->num_rows === 0) {
            jsonError('Vídeo não encontrado');
        }
        
        $sql = "DELETE FROM videos WHERE id = ?";
        $db->delete($sql, [$id]);
        
        // ✅ OTIMIZAÇÃO: Limpar cache após modificação
        clearVideosCache();
        
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        error_log("Erro ao deletar vídeo: " . $e->getMessage());
        jsonError('Erro ao deletar vídeo: ' . $e->getMessage(), 500);
    }
}

// ✅ OTIMIZAÇÃO: Função para limpar cache dos vídeos
function clearVideosCache() {
    $cachePattern = __DIR__ . '/cache_video*.json';
    foreach (glob($cachePattern) as $cacheFile) {
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }
}

function updateNewStatus($db) {
    try {
        // Atualizar vídeos que passaram da data de expiração do status "NOVO"
        $sql = "UPDATE videos SET is_new = FALSE WHERE is_new = TRUE AND new_until < NOW()";
        $db->update($sql);
    } catch (Exception $e) {
        error_log("Erro ao atualizar status novo: " . $e->getMessage());
    }
}

function jsonResponse($data, $statusCode = 200) {
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($message, $statusCode = 400) {
    error_log("ERRO JSON: " . $message . " (Status: " . $statusCode . ")");
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
