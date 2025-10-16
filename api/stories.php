
<?php
// ✅ OTIMIZAÇÃO: Compressão GZIP
ob_start("ob_gzhandler");

error_log("=== INICIANDO API STORIES ===");

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

// ✅ OTIMIZAÇÃO: Sistema de cache para consultas GET de histórias
function getCachedData($cacheFile, $cacheTime = 300) { // 5 minutos para histórias
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
        return file_get_contents($cacheFile);
    }
    return false;
}

function setCachedData($cacheFile, $data) {
    file_put_contents($cacheFile, $data);
}

function clearStoriesCache() {
    $cachePattern = __DIR__ . '/cache_stor*.json';
    foreach (glob($cachePattern) as $cacheFile) {
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }
}

try {
    $db = new Database();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    error_log("MÉTODO: " . $method . " | AÇÃO: " . $action);

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
    error_log("ERRO GERAL NA API DE HISTÓRIAS: " . $e->getMessage());
    jsonError('Erro interno do servidor: ' . $e->getMessage(), 500);
}

function handleGet($db, $action) {
    switch ($action) {
        case 'all':
            getAllStories($db);
            break;
        case 'by-id':
            getStoryById($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePost($db, $action) {
    switch ($action) {
        case 'create':
            createStory($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePut($db, $action) {
    switch ($action) {
        case 'update':
            updateStory($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handleDelete($db, $action) {
    switch ($action) {
        case 'delete':
            deleteStory($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function getAllStories($db) {
    error_log("=== BUSCANDO TODAS AS HISTÓRIAS ===");
    
    try {
        // ✅ OTIMIZAÇÃO: Cache de 5 minutos para lista de histórias
        $cacheFile = __DIR__ . '/cache_stories_all.json';
        $cacheTime = 300; // 5 minutos
        
        $cachedData = getCachedData($cacheFile, $cacheTime);
        if ($cachedData !== false) {
            echo $cachedData;
            return;
        }
        
        $sql = "SELECT id, title, content, order_number, created_at, is_new, image_url, pdf_url, new_until, testament FROM stories ORDER BY order_number ASC";
        $result = $db->query($sql);
        
        $stories = [];
        while ($row = $result->fetch_assoc()) {
            $row['id'] = (string)$row['id']; // Converter para string
            $row['is_new'] = (bool)$row['is_new'];
            $row['order_number'] = (int)$row['order_number'];
            $stories[] = $row;
        }
        
        $jsonData = json_encode(['data' => $stories], JSON_UNESCAPED_UNICODE);
        setCachedData($cacheFile, $jsonData);
        
        error_log("HISTÓRIAS ENCONTRADAS: " . count($stories));
        echo $jsonData;
    } catch (Exception $e) {
        error_log("ERRO AO BUSCAR HISTÓRIAS: " . $e->getMessage());
        jsonError('Erro ao buscar histórias: ' . $e->getMessage(), 500);
    }
}

function getStoryById($db) {
    $id = $_GET['id'] ?? '';
    error_log("=== BUSCANDO HISTÓRIA POR ID: " . $id . " ===");
    
    if (empty($id)) {
        jsonError('ID é obrigatório');
        return;
    }
    
    try {
        // ✅ OTIMIZAÇÃO: Cache individual por história
        $cacheFile = __DIR__ . "/cache_story_{$id}.json";
        $cacheTime = 300; // 5 minutos
        
        $cachedData = getCachedData($cacheFile, $cacheTime);
        if ($cachedData !== false) {
            echo $cachedData;
            return;
        }
        
        $sql = "SELECT id, title, content, order_number, created_at, is_new, image_url, pdf_url, new_until, testament FROM stories WHERE id = ?";
        $result = $db->query($sql, [$id]);
        
        if ($result->num_rows === 0) {
            error_log("HISTÓRIA NÃO ENCONTRADA");
            jsonResponse(['data' => null]);
            return;
        }
        
        $story = $result->fetch_assoc();
        $story['id'] = (string)$story['id']; // Converter para string
        $story['is_new'] = (bool)$story['is_new'];
        $story['order_number'] = (int)$story['order_number'];
        
        $jsonData = json_encode(['data' => $story], JSON_UNESCAPED_UNICODE);
        setCachedData($cacheFile, $jsonData);
        
        error_log("HISTÓRIA ENCONTRADA: " . $story['title']);
        echo $jsonData;
    } catch (Exception $e) {
        error_log("ERRO AO BUSCAR HISTÓRIA POR ID: " . $e->getMessage());
        jsonError('Erro ao buscar história: ' . $e->getMessage(), 500);
    }
}

/* Modified createStory implementation */
function createStory($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $title = $input['title'] ?? '';
        $content = $input['content'] ?? '';
        $image_url = $input['image_url'] ?? '';
        $pdf_url = $input['pdf_url'] ?? '';
        $order_number = $input['order_number'] ?? null;
        $is_new = $input['is_new'] ?? true; // 🔧 CORRIGIDO: Por padrão NOVO
        $testament = $input['testament'] ?? 'old';
        
        if (empty($title) || empty($content)) {
            jsonError('Título e conteúdo são obrigatórios');
        }
        
        // 🔧 CORRIGIDO: Calcular automaticamente o próximo número de ordem se não fornecido
        if ($order_number === null || $order_number <= 0) {
            $maxOrderSql = "SELECT MAX(position_number) as max_order FROM stories";
            $maxResult = $db->query($maxOrderSql);
            $maxRow = $maxResult->fetch_assoc();
            $order_number = ($maxRow['max_order'] ?? 0) + 1;
        }
        
        // Reorganizar histórias existentes se necessário (apenas se order_number específico foi fornecido)
        if ($input['order_number'] ?? null) {
            $updateOrderSql = "UPDATE stories SET position_number = position_number + 1 WHERE position_number >= ?";
            $db->update($updateOrderSql, [$order_number]);
        }
        
        // 🔧 CORRIGIDO: Calcular data de expiração do \"NOVO\" (30 dias a partir de hoje) sempre que is_new for true
        $new_until = null;
        if ($is_new) {
            $new_until = date('Y-m-d H:i:s', strtotime('+30 days'));
        }
        
        // 🔧 CORRIGIDO: Garantir que position_number sempre tenha um valor
        $sql = "INSERT INTO stories (title, content, image_url, pdf_url, position_number, is_new, new_until, testament) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $storyId = $db->insert($sql, [$title, $content, $image_url, $pdf_url, $order_number, $is_new, $new_until, $testament]);
        
        // ✅ OTIMIZAÇÃO: Limpar cache após modificação
        clearStoriesCache();
        
        // Buscar história criada
        $getStorySql = "SELECT id, title, content, image_url, pdf_url, position_number as order_number, created_at, is_new, new_until, testament FROM stories WHERE id = ?";
        $result = $db->query($getStorySql, [$storyId]);
        $story = $result->fetch_assoc();
        
        $story['is_new'] = (bool)$story['is_new'];
        
        jsonResponse(['data' => $story]);
    } catch (Exception $e) {
        error_log("Erro ao criar história: " . $e->getMessage());
        jsonError('Erro ao criar história: ' . $e->getMessage(), 500);
    }
}

/* Modified updateStory implementation */
function updateStory($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $id = $input['id'] ?? '';
        
        if (empty($id)) {
            jsonError('ID é obrigatório');
        }
        
        // Verificar se história existe - CORRIGIDO: Usar position_number
        $checkSql = "SELECT id, position_number FROM stories WHERE id = ?";
        $checkResult = $db->query($checkSql, [$id]);
        
        if ($checkResult->num_rows === 0) {
            jsonError('História não encontrada');
        }
        
        $currentStory = $checkResult->fetch_assoc();
        $currentOrder = $currentStory['position_number'];
        
        // Construir query de update dinamicamente
        $updateFields = [];
        $params = [];
        
        if (isset($input['title'])) {
            $updateFields[] = "title = ?";
            $params[] = $input['title'];
        }
        if (isset($input['content'])) {
            $updateFields[] = "content = ?";
            $params[] = $input['content'];
        }
        if (isset($input['image_url'])) {
            $updateFields[] = "image_url = ?";
            $params[] = $input['image_url'];
        }
        if (isset($input['pdf_url'])) {
            $updateFields[] = "pdf_url = ?";
            $params[] = $input['pdf_url'];
        }
        if (isset($input['order_number']) && $input['order_number'] != $currentOrder) {
            $newOrder = $input['order_number'];
            
            // Reorganizar outras histórias - CORRIGIDO: Usar position_number
            if ($newOrder > $currentOrder) {
                // Movendo para baixo: decrementar histórias entre currentOrder e newOrder
                $reorderSql = "UPDATE stories SET position_number = position_number - 1 WHERE position_number > ? AND position_number <= ? AND id != ?";
                $db->update($reorderSql, [$currentOrder, $newOrder, $id]);
            } else {
                // Movendo para cima: incrementar histórias entre newOrder e currentOrder
                $reorderSql = "UPDATE stories SET position_number = position_number + 1 WHERE position_number >= ? AND position_number < ? AND id != ?";
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
        $sql = "UPDATE stories SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $db->update($sql, $params);
        
        // ✅ OTIMIZAÇÃO: Limpar cache após modificação
        clearStoriesCache();
        
        // Buscar história atualizada - CORRIGIDO: Usar position_number
        $getStorySql = "SELECT id, title, content, image_url, pdf_url, position_number as order_number, created_at, is_new, new_until, testament FROM stories WHERE id = ?";
        $result = $db->query($getStorySql, [$id]);
        $story = $result->fetch_assoc();
        
        $story['is_new'] = (bool)$story['is_new'];
        
        jsonResponse(['data' => $story]);
    } catch (Exception $e) {
        error_log("Erro ao atualizar história: " . $e->getMessage());
        jsonError('Erro ao atualizar história: ' . $e->getMessage(), 500);
    }
}

function deleteStory($db) {
    error_log("=== DELETANDO HISTÓRIA ===");
    
    try {
        $id = $_GET['id'] ?? '';
        
        if (empty($id)) {
            jsonError('ID é obrigatório');
            return;
        }
        
        // Verificar se história existe
        $checkSql = "SELECT id, title FROM stories WHERE id = ?";
        $checkResult = $db->query($checkSql, [$id]);
        
        if ($checkResult->num_rows === 0) {
            error_log("ERRO: História não encontrada");
            jsonError('História não encontrada');
            return;
        }
        
        $story = $checkResult->fetch_assoc();
        
        // 🔧 CORRIGIDO: Usar query direta em vez de prepared statement
        $idSanitized = (int)$id; // Sanitizar como inteiro
        $sql = "DELETE FROM stories WHERE id = $idSanitized";
        
        $result = $db->getConnection()->query($sql);
        
        if (!$result) {
            throw new Exception("Erro ao executar query de exclusão: " . $db->getConnection()->error);
        }
        
        $affectedRows = $db->getConnection()->affected_rows;
        
        // ✅ OTIMIZAÇÃO: Limpar cache após modificação
        clearStoriesCache();
        
        error_log("HISTÓRIA DELETADA: " . $story['title'] . ". LINHAS AFETADAS: " . $affectedRows);
        jsonResponse(['success' => true, 'message' => 'História deletada com sucesso']);
        
    } catch (Exception $e) {
        error_log("ERRO AO DELETAR HISTÓRIA: " . $e->getMessage());
        jsonError('Erro ao deletar história: ' . $e->getMessage(), 500);
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
