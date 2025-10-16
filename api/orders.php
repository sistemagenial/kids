
<?php
// Headers para CORS e JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

// Funções helper para JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function jsonError($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
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
        default:
            jsonError('Método não permitido', 405);
    }
} catch (Exception $e) {
    error_log("Erro na API de pedidos: " . $e->getMessage());
    jsonError('Erro interno do servidor', 500);
}

function handleGet($db, $action) {
    switch ($action) {
        case 'all':
            getAllPurchaseOrders($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePost($db, $action) {
    switch ($action) {
        case 'create':
            createPurchaseOrder($db);
            break;
        case 'create-user-from-order':
            createUserFromOrder($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function handlePut($db, $action) {
    switch ($action) {
        case 'update-status':
            updatePurchaseOrderStatus($db);
            break;
        default:
            jsonError('Ação não encontrada');
    }
}

function getAllPurchaseOrders($db) {
    try {
        error_log("=== BUSCANDO TODOS OS PEDIDOS ===");
        
        // CORRIGIDO: Remover plan_details da query se não existir no banco
        $sql = "SELECT id, name, email, cpf, whatsapp, plan, status, created_at, user_created_at, notes FROM purchase_orders ORDER BY created_at DESC";
        $result = $db->query($sql);
        
        $orders = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                // Criar planDetails baseado no campo plan
                $planDetails = [];
                switch ($row['plan']) {
                    case 'basic':
                        $planDetails = ['name' => 'Plano Básico', 'devices' => 1, 'price' => 'R$ 29,90'];
                        break;
                    case 'pro':
                        $planDetails = ['name' => 'Plano PRO', 'devices' => 3, 'price' => 'R$ 49,90'];
                        break;
                    case 'premium':
                        $planDetails = ['name' => 'Plano Premium', 'devices' => 5, 'price' => 'R$ 69,90'];
                        break;
                    default:
                        $planDetails = ['name' => 'Plano Personalizado', 'devices' => 1, 'price' => 'Consultar'];
                }
                $row['planDetails'] = $planDetails;
                $orders[] = $row;
            }
        }
        
        error_log("PEDIDOS ENCONTRADOS: " . count($orders));
        jsonResponse(['data' => $orders]);
        
    } catch (Exception $e) {
        error_log("ERRO ao buscar pedidos: " . $e->getMessage());
        jsonError('Erro ao buscar pedidos: ' . $e->getMessage(), 500);
    }
}

function createPurchaseOrder($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $cpf = $input['cpf'] ?? '';
        $whatsapp = $input['whatsapp'] ?? '';
        $plan = $input['plan'] ?? '';
        $planDetails = $input['planDetails'] ?? [];
        
        if (empty($name) || empty($email) || empty($cpf) || empty($plan)) {
            jsonError('Todos os campos são obrigatórios');
        }
        
        // CORRIGIDO: Não incluir plan_details na query se não existir no banco
        $sql = "INSERT INTO purchase_orders (name, email, cpf, whatsapp, plan, status) VALUES (?, ?, ?, ?, ?, 'pending')";
        
        $orderId = $db->insert($sql, [$name, $email, $cpf, $whatsapp, $plan]);
        
        // Buscar pedido criado
        $getOrderSql = "SELECT id, name, email, cpf, whatsapp, plan, status, created_at, user_created_at, notes FROM purchase_orders WHERE id = ?";
        $result = $db->query($getOrderSql, [$orderId]);
        $order = $result->fetch_assoc();
        
        // Criar planDetails baseado no campo plan
        $planDetailsResponse = [];
        switch ($order['plan']) {
            case 'basic':
                $planDetailsResponse = ['name' => 'Plano Básico', 'devices' => 1, 'price' => 'R$ 29,90'];
                break;
            case 'pro':
                $planDetailsResponse = ['name' => 'Plano PRO', 'devices' => 3, 'price' => 'R$ 49,90'];
                break;
            case 'premium':
                $planDetailsResponse = ['name' => 'Plano Premium', 'devices' => 5, 'price' => 'R$ 69,90'];
                break;
            default:
                $planDetailsResponse = ['name' => 'Plano Personalizado', 'devices' => 1, 'price' => 'Consultar'];
        }
        $order['planDetails'] = $planDetailsResponse;
        
        jsonResponse(['data' => $order]);
        
    } catch (Exception $e) {
        error_log("ERRO ao criar pedido: " . $e->getMessage());
        jsonError('Erro ao criar pedido: ' . $e->getMessage(), 500);
    }
}

function updatePurchaseOrderStatus($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $id = $input['id'] ?? '';
        $status = $input['status'] ?? '';
        $notes = $input['notes'] ?? '';
        
        if (empty($id) || empty($status)) {
            jsonError('ID e status são obrigatórios');
        }
        
        // Verificar se pedido existe
        $checkSql = "SELECT id FROM purchase_orders WHERE id = ?";
        $checkResult = $db->query($checkSql, [$id]);
        
        if ($checkResult->num_rows === 0) {
            jsonError('Pedido não encontrado');
        }
        
        $updateFields = ["status = ?"];
        $params = [$status];
        
        if (!empty($notes)) {
            $updateFields[] = "notes = ?";
            $params[] = $notes;
        }
        
        if ($status === 'user_created') {
            $updateFields[] = "user_created_at = NOW()";
        }
        
        $params[] = $id;
        $sql = "UPDATE purchase_orders SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $db->update($sql, $params);
        
        // Buscar pedido atualizado
        $getOrderSql = "SELECT id, name, email, cpf, whatsapp, plan, status, created_at, user_created_at, notes FROM purchase_orders WHERE id = ?";
        $result = $db->query($getOrderSql, [$id]);
        $order = $result->fetch_assoc();
        
        // Criar planDetails baseado no campo plan
        $planDetails = [];
        switch ($order['plan']) {
            case 'basic':
                $planDetails = ['name' => 'Plano Básico', 'devices' => 1, 'price' => 'R$ 29,90'];
                break;
            case 'pro':
                $planDetails = ['name' => 'Plano PRO', 'devices' => 3, 'price' => 'R$ 49,90'];
                break;
            case 'premium':
                $planDetails = ['name' => 'Plano Premium', 'devices' => 5, 'price' => 'R$ 69,90'];
                break;
            default:
                $planDetails = ['name' => 'Plano Personalizado', 'devices' => 1, 'price' => 'Consultar'];
        }
        $order['planDetails'] = $planDetails;
        
        jsonResponse(['data' => $order]);
        
    } catch (Exception $e) {
        error_log("ERRO ao atualizar status do pedido: " . $e->getMessage());
        jsonError('Erro ao atualizar status: ' . $e->getMessage(), 500);
    }
}

function createUserFromOrder($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $orderId = $input['order_id'] ?? '';
        
        if (empty($orderId)) {
            jsonError('ID do pedido é obrigatório');
        }
        
        // Buscar pedido
        $orderSql = "SELECT id, name, email, cpf, whatsapp, plan, status FROM purchase_orders WHERE id = ?";
        $orderResult = $db->query($orderSql, [$orderId]);
        
        if ($orderResult->num_rows === 0) {
            jsonError('Pedido não encontrado');
        }
        
        $order = $orderResult->fetch_assoc();
        
        if ($order['status'] === 'user_created') {
            jsonError('Usuário já foi criado para este pedido');
        }
        
        // Verificar se já existe usuário com este email
        $checkUserSql = "SELECT id FROM users WHERE email = ?";
        $checkUserResult = $db->query($checkUserSql, [$order['email']]);
        
        if ($checkUserResult->num_rows > 0) {
            jsonError('Já existe um usuário cadastrado com este email');
        }
        
        // Determinar licenseCount baseado no plano
        $licenseCount = 1;
        switch ($order['plan']) {
            case 'basic':
                $licenseCount = 1;
                break;
            case 'pro':
                $licenseCount = 3;
                break;
            case 'premium':
                $licenseCount = 5;
                break;
        }
        
        $accessExpiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
        
        // Criar usuário
        $createUserSql = "INSERT INTO users (name, email, cpf, whatsapp, license_count, access_expires_at, stories_progress, favorite_stories, videos_progress, favorite_videos) VALUES (?, ?, ?, ?, ?, ?, '{}', '[]', '{}', '[]')";
        
        $userId = $db->insert($createUserSql, [$order['name'], $order['email'], $order['cpf'], $order['whatsapp'], $licenseCount, $accessExpiresAt]);
        
        // Atualizar status do pedido
        $updateOrderSql = "UPDATE purchase_orders SET status = 'user_created', user_created_at = NOW() WHERE id = ?";
        $db->update($updateOrderSql, [$orderId]);
        
        // Buscar usuário criado
        $getUserSql = "SELECT id, name, email, cpf, whatsapp, license_count, access_expires_at, created_at, last_login, is_admin, stories_progress, favorite_stories, videos_progress, favorite_videos FROM users WHERE id = ?";
        $result = $db->query($getUserSql, [$userId]);
        $user = $result->fetch_assoc();
        
        $user['id'] = (string)$user['id'];
        $user['stories_progress'] = json_decode($user['stories_progress'] ?? '{}', true);
        $user['favorite_stories'] = json_decode($user['favorite_stories'] ?? '[]', true);
        $user['videos_progress'] = json_decode($user['videos_progress'] ?? '{}', true);
        $user['favorite_videos'] = json_decode($user['favorite_videos'] ?? '[]', true);
        $user['is_admin'] = (bool)$user['is_admin'];
        
        jsonResponse(['data' => $user]);
        
    } catch (Exception $e) {
        error_log("ERRO ao criar usuário do pedido: " . $e->getMessage());
        jsonError('Erro ao criar usuário: ' . $e->getMessage(), 500);
    }
}
?>
