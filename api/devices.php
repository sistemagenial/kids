
<?php
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
    error_log("Erro na API de dispositivos: " . $e->getMessage());
    jsonError('Erro interno do servidor', 500);
}

function handleGet($db, $action) {
    switch ($action) {
        case 'user-devices':
            getUserDevices($db);
            break;
        case 'check-device-limit':
            checkDeviceLimit($db);
            break;
        case 'heartbeat':
            heartbeat($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePost($db, $action) {
    switch ($action) {
        case 'register':
            registerDevice($db);
            break;
        case 'logout-device':
            logoutDevice($db);
            break;
        case 'update-name':
            updateDeviceName($db);
            break;
        case 'heartbeat':
            heartbeat($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePut($db, $action) {
    switch ($action) {
        case 'update-name':
            updateDeviceName($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handleDelete($db, $action) {
    switch ($action) {
        case 'remove':
            removeDevice($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

// 🔧 CORRIGIDO: Listar apenas dispositivos únicos e ativos (últimos 30 minutos)
function getUserDevices($db) {
    try {
        $userId = $_GET['user_id'] ?? '';
        
        if (empty($userId)) {
            jsonError('ID do usuário é obrigatório');
        }
        
        // 🔧 NOVA QUERY: Buscar apenas dispositivos únicos ativos nos últimos 30 minutos
        $activeWindowMinutes = 30;
        $sql = "SELECT ud.id, ud.user_id, ud.device_id, ud.name, ud.type, ud.last_access, ud.ip, ud.is_active, ud.session_token, 
                       ud.browser, ud.os_info, ud.screen_resolution, ud.user_agent_info 
                FROM user_devices ud
                WHERE ud.user_id = ? 
                  AND ud.is_active = TRUE
                  AND ud.last_access >= (NOW() - INTERVAL {$activeWindowMinutes} MINUTE)
                ORDER BY ud.last_access DESC";
        $result = $db->query($sql, [$userId]);
        
        $devices = [];
        while ($row = $result->fetch_assoc()) {
            $row['is_active'] = (bool)$row['is_active'];
            $devices[] = $row;
        }
        
        error_log("✅ Dispositivos únicos ativos encontrados: " . count($devices));
        
        jsonResponse(['data' => $devices]);
    } catch (Exception $e) {
        error_log("Erro ao buscar dispositivos: " . $e->getMessage());
        jsonError('Erro ao buscar dispositivos: ' . $e->getMessage(), 500);
    }
}

function checkDeviceLimit($db) {
    try {
        $userId = $_GET['user_id'] ?? '';
        $deviceId = $_GET['device_id'] ?? '';
        
        if (empty($userId) || empty($deviceId)) {
            jsonError('ID do usuário e ID do dispositivo são obrigatórios');
        }
        
        // Buscar informações do usuário
        $userSql = "SELECT license_count, is_admin FROM users WHERE id = ?";
        $userResult = $db->query($userSql, [$userId]);
        
        if ($userResult->num_rows === 0) {
            jsonError('Usuário não encontrado');
        }
        
        $user = $userResult->fetch_assoc();
        
        // Admin tem acesso ilimitado
        if ($user['is_admin']) {
            jsonResponse(['can_access' => true, 'message' => 'Acesso de administrador']);
            return;
        }
        
        // 🔧 CORRIGIDO: Verificar se o dispositivo específico já está registrado e ativo
        $deviceSql = "SELECT id, session_token FROM user_devices WHERE user_id = ? AND device_id = ? AND is_active = TRUE AND last_access >= (NOW() - INTERVAL 30 MINUTE)";
        $deviceResult = $db->query($deviceSql, [$userId, $deviceId]);
        
        if ($deviceResult->num_rows > 0) {
            jsonResponse(['can_access' => true, 'message' => 'Dispositivo já registrado']);
            return;
        }
        
        // 🔧 CORRIGIDO: Contar dispositivos únicos ativos nos últimos 30 minutos
        $countSql = "SELECT COUNT(DISTINCT device_id) as active_count FROM user_devices WHERE user_id = ? AND is_active = TRUE AND last_access >= (NOW() - INTERVAL 30 MINUTE)";
        $countResult = $db->query($countSql, [$userId]);
        $count = $countResult->fetch_assoc();
        
        $canAccess = $count['active_count'] < $user['license_count'];
        
        jsonResponse([
            'can_access' => $canAccess,
            'active_devices' => (int)$count['active_count'],
            'max_devices' => (int)$user['license_count'],
            'message' => $canAccess ? 'Acesso permitido' : 'Limite de dispositivos atingido'
        ]);
    } catch (Exception $e) {
        error_log("Erro ao verificar limite de dispositivos: " . $e->getMessage());
        jsonError('Erro ao verificar limite de dispositivos: ' . $e->getMessage(), 500);
    }
}

// 🔧 CORRIGIDO: Função de registro com UPSERT robusto
function registerDevice($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = (int)($input['user_id'] ?? 0);
        $device_id = $input['device_id'] ?? '';
        $name = $input['name'] ?? '';
        $type = $input['type'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $session_token = $input['session_token'] ?? '';
        $browser = $input['browser'] ?? '';
        $os_info = $input['os'] ?? '';
        $screen_resolution = $input['screen'] ?? '';
        $user_agent_info = $input['userAgent'] ?? '';
        
        if (!$user_id || !$device_id || !$name || !$type) {
            jsonError('Todos os campos obrigatórios devem ser preenchidos');
        }
        
        // Gerar token de sessão se não fornecido
        if (empty($session_token)) {
            $session_token = bin2hex(random_bytes(32));
        }
        
        // Verificar informações do usuário
        $userSql = "SELECT license_count, is_admin FROM users WHERE id = ?";
        $userResult = $db->query($userSql, [$user_id]);
        
        if ($userResult->num_rows === 0) {
            jsonError('Usuário não encontrado');
        }
        
        $user = $userResult->fetch_assoc();
        
        // 🔧 VERIFICAR se já existe registro para este device_id
        $checkExistingSql = "SELECT id FROM user_devices WHERE user_id = ? AND device_id = ?";
        $existingResult = $db->query($checkExistingSql, [$user_id, $device_id]);
        
        if ($existingResult->num_rows > 0) {
            // 🔧 ATUALIZAR registro existente (reativar e atualizar last_access)
            $existingDevice = $existingResult->fetch_assoc();
            $updateSql = "UPDATE user_devices SET 
                         name = ?, type = ?, last_access = NOW(), ip = ?, is_active = TRUE, 
                         session_token = ?, browser = ?, os_info = ?, screen_resolution = ?, user_agent_info = ?
                         WHERE id = ?";
            $db->update($updateSql, [$name, $type, $ip, $session_token, $browser, $os_info, $screen_resolution, $user_agent_info, $existingDevice['id']]);
            
            $deviceDbId = $existingDevice['id'];
            
            error_log("✅ Dispositivo reativado (UPSERT): ID {$deviceDbId}");
        } else {
            // 🔧 VERIFICAR LIMITE apenas para dispositivos completamente novos (não admin)
            if (!$user['is_admin']) {
                $activeWindowMinutes = 30;
                $countSql = "SELECT COUNT(DISTINCT device_id) as active_count FROM user_devices WHERE user_id = ? AND is_active = TRUE AND last_access >= (NOW() - INTERVAL {$activeWindowMinutes} MINUTE)";
                $countResult = $db->query($countSql, [$user_id]);
                $count = $countResult->fetch_assoc();
                
                if ($count['active_count'] >= $user['license_count']) {
                    jsonError('Limite de dispositivos atingido. Remova um dispositivo antes de adicionar outro.');
                }
            }
            
            // 🔧 INSERIR novo dispositivo
            $insertSql = "INSERT INTO user_devices (user_id, device_id, name, type, ip, is_active, session_token, browser, os_info, screen_resolution, user_agent_info, last_access) 
                         VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, NOW())";
            $deviceDbId = $db->insert($insertSql, [$user_id, $device_id, $name, $type, $ip, $session_token, $browser, $os_info, $screen_resolution, $user_agent_info]);
            
            error_log("✅ Novo dispositivo criado: ID {$deviceDbId}");
        }
        
        // Buscar dispositivo final (atualizado ou criado)
        $getDeviceSql = "SELECT id, user_id, device_id, name, type, last_access, ip, is_active, session_token, 
                        browser, os_info, screen_resolution, user_agent_info 
                        FROM user_devices WHERE id = ?";
        $result = $db->query($getDeviceSql, [$deviceDbId]);
        
        $device = $result->fetch_assoc();
        $device['is_active'] = (bool)$device['is_active'];
        
        jsonResponse(['data' => $device]);
    } catch (Exception $e) {
        error_log("Erro ao registrar dispositivo: " . $e->getMessage());
        jsonError('Erro ao registrar dispositivo: ' . $e->getMessage(), 500);
    }
}

// 🆕 NOVA FUNÇÃO: Heartbeat para manter sessão ativa
function heartbeat($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $session_token = $input['session_token'] ?? '';
        
        if (empty($session_token)) {
            jsonError('Token de sessão é obrigatório');
        }
        
        // Atualizar last_access para manter a sessão ativa
        $sql = "UPDATE user_devices SET last_access = NOW() WHERE session_token = ? AND is_active = TRUE";
        $affectedRows = $db->update($sql, [$session_token]);
        
        if ($affectedRows === 0) {
            jsonError('Sessão não encontrada ou inativa');
        }
        
        jsonResponse(['success' => true, 'message' => 'Heartbeat atualizado']);
    } catch (Exception $e) {
        error_log("Erro no heartbeat: " . $e->getMessage());
        jsonError('Erro no heartbeat: ' . $e->getMessage(), 500);
    }
}

function updateDeviceName($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = $input['user_id'] ?? '';
        $device_id = $input['device_id'] ?? '';
        $new_name = $input['name'] ?? '';
        
        if (empty($user_id) || empty($device_id) || empty($new_name)) {
            jsonError('Todos os campos são obrigatórios');
        }
        
        // Verificar se dispositivo existe
        $checkSql = "SELECT id FROM user_devices WHERE user_id = ? AND device_id = ? AND is_active = TRUE";
        $checkResult = $db->query($checkSql, [$user_id, $device_id]);
        
        if ($checkResult->num_rows === 0) {
            jsonError('Dispositivo não encontrado');
        }
        
        // Atualizar nome do dispositivo
        $updateSql = "UPDATE user_devices SET name = ?, last_access = NOW() WHERE user_id = ? AND device_id = ? AND is_active = TRUE";
        $affectedRows = $db->update($updateSql, [$new_name, $user_id, $device_id]);
        
        if ($affectedRows === 0) {
            jsonError('Erro ao atualizar nome do dispositivo');
        }
        
        // Buscar dispositivo atualizado
        $getDeviceSql = "SELECT id, user_id, device_id, name, type, last_access, ip, is_active, session_token, 
                        browser, os_info, screen_resolution, user_agent_info 
                        FROM user_devices WHERE user_id = ? AND device_id = ? AND is_active = TRUE";
        $result = $db->query($getDeviceSql, [$user_id, $device_id]);
        
        $device = $result->fetch_assoc();
        $device['is_active'] = (bool)$device['is_active'];
        
        jsonResponse(['data' => $device, 'message' => 'Nome do dispositivo atualizado com sucesso']);
    } catch (Exception $e) {
        error_log("Erro ao atualizar nome do dispositivo: " . $e->getMessage());
        jsonError('Erro ao atualizar nome do dispositivo: ' . $e->getMessage(), 500);
    }
}

// 🔧 CORRIGIDO: Função removeDevice
function removeDevice($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = $input['user_id'] ?? $_GET['user_id'] ?? '';
        $deviceId = $input['device_id'] ?? $_GET['device_id'] ?? '';
        
        if (empty($userId) || empty($deviceId)) {
            jsonError('ID do usuário e ID do dispositivo são obrigatórios');
        }
        
        // 🔧 CORRIGIDO: Desativar o dispositivo específico
        $sql = "UPDATE user_devices SET is_active = FALSE, session_token = NULL WHERE user_id = ? AND device_id = ?";
        $affectedRows = $db->update($sql, [$userId, $deviceId]);
        
        if ($affectedRows === 0) {
            jsonError('Dispositivo não encontrado');
        }
        
        jsonResponse([
            'success' => true,
            'affected_rows' => $affectedRows,
            'message' => 'Dispositivo removido com sucesso'
        ]);
    } catch (Exception $e) {
        error_log("Erro ao remover dispositivo: " . $e->getMessage());
        jsonError('Erro ao remover dispositivo: ' . $e->getMessage(), 500);
    }
}

function logoutDevice($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $session_token = $input['session_token'] ?? '';
        
        if (empty($session_token)) {
            jsonError('Token de sessão é obrigatório');
        }
        
        // Desativar dispositivo pelo token de sessão
        $sql = "UPDATE user_devices SET is_active = FALSE, session_token = NULL WHERE session_token = ?";
        $affectedRows = $db->update($sql, [$session_token]);
        
        if ($affectedRows === 0) {
            jsonError('Sessão não encontrada ou já encerrada');
        }
        
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        error_log("Erro ao fazer logout do dispositivo: " . $e->getMessage());
        jsonError('Erro ao fazer logout do dispositivo: ' . $e->getMessage(), 500);
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
