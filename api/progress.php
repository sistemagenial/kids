<?php
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
        default:
            jsonError('Método não permitido', 405);
    }
} catch (Exception $e) {
    error_log("Erro na API de progresso: " . $e->getMessage());
    jsonError('Erro interno do servidor', 500);
}

function handleGet($db, $action) {
    switch ($action) {
        case 'user-progress':
            getUserProgress($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePost($db, $action) {
    switch ($action) {
        case 'update':
            updateUserProgress($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function getUserProgress($db) {
    $userId = $_GET['user_id'] ?? '';
    
    if (empty($userId)) {
        jsonError('ID do usuário é obrigatório');
    }
    
    $sql = "SELECT id, user_id, story_id, completed, completed_at FROM user_progress WHERE user_id = ?";
    $result = $db->query($sql, [$userId]);
    
    $progress = [];
    while ($row = $result->fetch_assoc()) {
        $row['completed'] = (bool)$row['completed'];
        $progress[] = $row;
    }
    
    jsonResponse(['data' => $progress]);
}

function updateUserProgress($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $user_id = $input['user_id'] ?? '';
    $story_id = $input['story_id'] ?? '';
    $completed = $input['completed'] ?? false;
    
    if (empty($user_id) || empty($story_id)) {
        jsonError('ID do usuário e ID da história são obrigatórios');
    }
    
    // Verificar se progresso já existe
    $checkSql = "SELECT id FROM user_progress WHERE user_id = ? AND story_id = ?";
    $checkResult = $db->query($checkSql, [$user_id, $story_id]);
    
    if ($checkResult->num_rows > 0) {
        // Atualizar progresso existente
        $completed_at = $completed ? date('Y-m-d H:i:s') : null;
        $updateSql = "UPDATE user_progress SET completed = ?, completed_at = ? WHERE user_id = ? AND story_id = ?";
        $db->update($updateSql, [$completed, $completed_at, $user_id, $story_id]);
        
        // Buscar progresso atualizado
        $getProgressSql = "SELECT id, user_id, story_id, completed, completed_at FROM user_progress WHERE user_id = ? AND story_id = ?";
        $result = $db->query($getProgressSql, [$user_id, $story_id]);
    } else {
        // Criar novo progresso
        $completed_at = $completed ? date('Y-m-d H:i:s') : null;
        $insertSql = "INSERT INTO user_progress (user_id, story_id, completed, completed_at) VALUES (?, ?, ?, ?)";
        $progressId = $db->insert($insertSql, [$user_id, $story_id, $completed, $completed_at]);
        
        // Buscar progresso criado
        $getProgressSql = "SELECT id, user_id, story_id, completed, completed_at FROM user_progress WHERE id = ?";
        $result = $db->query($getProgressSql, [$progressId]);
    }
    
    $progress = $result->fetch_assoc();
    $progress['completed'] = (bool)$progress['completed'];
    
    jsonResponse(['data' => $progress]);
}
?>