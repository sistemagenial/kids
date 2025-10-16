<?php
// Cabeçalhos e CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'config/database.php';

// ===== Helper de normalização =====
function normalizeUser(array $u): array {
    if (isset($u['id'])) $u['id'] = (int)$u['id'];
    if (isset($u['is_admin'])) $u['is_admin'] = (int)$u['is_admin']; // <-- evita "0" truthy
    if (isset($u['license_count'])) $u['license_count'] = (int)$u['license_count'];
    if (isset($u['cpf'])) $u['cpf'] = (string)$u['cpf'];
    if (isset($u['access_expires_at'])) $u['access_expires_at'] = (string)$u['access_expires_at'];
    if (isset($u['last_login'])) $u['last_login'] = (string)$u['last_login'];
    unset($u['password']); // nunca retornar senha
    return $u;
}

// Instanciar DB
try {
    $db = new Database();
} catch (Exception $e) {
    error_log("Erro ao conectar com banco: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro de conexão com banco de dados']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'create':
            createUser($db); exit;
        case 'update':
            updateUser($db); exit;
        case 'renew':
            $input = json_decode(file_get_contents('php://input'), true) ?: [];
            $input['access_expires_at'] = 'renew';
            $_GET['action'] = 'update';
            updateUser($db); exit;
        case 'delete':
            deleteUser($db); exit;
        case 'all':
            getAllUsers($db); exit;
        case 'login':
            loginUser($db); exit;
        case 'by-email':
            getUserByEmail($db); exit;
        case 'change-password':
            changePassword($db); exit;
        case 'delete-multiple':
            deleteMultipleUsers($db); exit;
        case 'renew-multiple':
            renewMultipleUsers($db); exit;
        case 'change-plan-multiple':
            changeMultipleUsersPlans($db); exit;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ação não encontrada: ' . $action]);
            exit;
    }
} catch (Exception $e) {
    error_log("Erro na API users.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
} catch (Error $e) {
    error_log("Erro fatal na API users.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno do servidor']);
    exit;
}

/* ======================= Funções auxiliares ======================= */

function sendWhatsAppNotification($phone, $message) {
    if (empty($phone)) return false;
    $whatsapp_data = ['phone'=>$phone,'message'=>$message,'type'=>'text'];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://profetadedeus.com.br/kids/api/whatsapp.php');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($whatsapp_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("Erro WhatsApp: " . $error);
        return false;
    }

    $result = json_decode($response, true);
    return isset($result['success']) && $result['success'];
}

function createWelcomeWhatsAppMessage($name, $email, $password = null) {
    return "🎉 *Bem-vindo ao Profeta de Deus Kids!*\n\n".
           "Olá *{$name}*! Sua conta foi criada com sucesso!\n\n".
           "📧 *Seu email de acesso:* {$email}\n\n".
           "🔗 *Acesse agora:*\n".
           "www.profetadedeus.com.br/kids/login\n\n".
           "Precisa de ajuda? Responda esta mensagem! 😊";
}

function createUpdateWhatsAppMessage($name, $email) {
    return "📝 *Dados Atualizados - Profeta de Deus Kids*\n\n".
           "Olá *{$name}*!\n\n".
           "Seus dados foram atualizados com sucesso!\n\n".
           "📧 *Email atual:* {$email}\n".
           "🔗 *Acesse:* www.profetadedeus.com.br/kids/login\n\n".
           "Se você não solicitou essa alteração, entre em contato conosco imediatamente.\n\n".
           "Precisa de ajuda? Responda esta mensagem! 😊";
}

function createRenewalWhatsAppMessage($name, $email) {
    return "🔄 *Licença Renovada - Profeta de Deus Kids*\n\n".
           "Olá *{$name}*!\n\n".
           "Sua licença foi renovada por mais *1 ano*! 🎉\n\n".
           "📧 *Email:* {$email}\n".
           "🔗 *Acesse:* www.profetadedeus.com.br/kids/login\n\n".
           "Continue aproveitando todo nosso conteúdo educativo!\n\n".
           "Precisa de ajuda? Responda esta mensagem! 😊";
}

/* ======================= Endpoints ======================= */

function createUser($db) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    if (empty($input['name']) || empty($input['email'])) {
        throw new Exception('Nome e email são obrigatórios');
    }

    $result = $db->query("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [$input['email']]);
    if ($result->num_rows > 0) {
        throw new Exception('Email já cadastrado');
    }

    $expiresAt = $input['access_expires_at'] ?? date('Y-m-d H:i:s', strtotime('+1 year'));

    // Sem coluna password
    $userId = $db->insert("
        INSERT INTO users (name, email, cpf, whatsapp, license_count, access_expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ", [
        $input['name'],
        $input['email'],
        $input['cpf'] ?? '',
        $input['whatsapp'] ?? '',
        $input['license_count'] ?? 1,
        $expiresAt
    ]);

    sendWelcomeEmail($input['email'], $input['name'], $input['email'], null, 'create');

    $whatsapp_sent = false;
    if (!empty($input['whatsapp'])) {
        $whatsapp_sent = sendWhatsAppNotification(
            $input['whatsapp'],
            createWelcomeWhatsAppMessage($input['name'], $input['email'])
        );
    }

    echo json_encode([
        'success' => true,
        'data' => ['id' => $userId, 'message' => 'Usuário criado com sucesso'],
        'notifications' => ['whatsapp_sent' => $whatsapp_sent]
    ]);
}

function updateUser($db) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    if (empty($input['id'])) throw new Exception('ID do usuário é obrigatório');

    $result = $db->query("SELECT * FROM users WHERE id = ?", [$input['id']]);
    if ($result->num_rows === 0) throw new Exception('Usuário não encontrado');
    $currentUser = $result->fetch_assoc();

    // Renovação
    if (isset($input['access_expires_at']) && $input['access_expires_at'] === 'renew') {
        $newExpiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
        $db->update("UPDATE users SET access_expires_at = ? WHERE id = ?", [$newExpiresAt, $input['id']]);

        $result = $db->query("SELECT * FROM users WHERE id = ?", [$input['id']]);
        $updatedUser = normalizeUser($result->fetch_assoc());

        sendWelcomeEmail($currentUser['email'], $currentUser['name'], $currentUser['email'], null, 'renew');

        $whatsapp_sent = false;
        if (!empty($currentUser['whatsapp'])) {
            $whatsapp_sent = sendWhatsAppNotification(
                $currentUser['whatsapp'],
                createRenewalWhatsAppMessage($currentUser['name'], $currentUser['email'])
            );
        }

        echo json_encode([
            'success' => true,
            'data' => $updatedUser,
            'message' => 'Usuário renovado por 1 ano',
            'notifications' => ['whatsapp_sent' => $whatsapp_sent]
        ]);
        return;
    }

    // Atualização normal
    $fields = [];
    $values = [];

    foreach (['name','email','cpf','whatsapp','license_count','access_expires_at'] as $f) {
        if (array_key_exists($f, $input)) {
            $fields[] = "$f = ?";
            $values[] = $input[$f];
        }
    }

    if (empty($fields)) throw new Exception('Nenhum campo para atualizar');

    $values[] = $input['id'];
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $db->update($sql, $values);

    $result = $db->query("SELECT * FROM users WHERE id = ?", [$input['id']]);
    $updatedUser = normalizeUser($result->fetch_assoc());

    $emailToSend = $input['email'] ?? $currentUser['email'];
    $nameToSend  = $input['name'] ?? $currentUser['name'];
    sendWelcomeEmail($emailToSend, $nameToSend, $emailToSend, null, 'update');

    $whatsapp_sent = false;
    $phoneToSend   = $input['whatsapp'] ?? $currentUser['whatsapp'];
    if (!empty($phoneToSend)) {
        $whatsapp_sent = sendWhatsAppNotification(
            $phoneToSend,
            createUpdateWhatsAppMessage($nameToSend, $emailToSend)
        );
    }

    echo json_encode([
        'success' => true,
        'data' => $updatedUser,
        'message' => 'Usuário atualizado com sucesso',
        'notifications' => ['whatsapp_sent' => $whatsapp_sent]
    ]);
}

function deleteUser($db) {
    $id = $_GET['id'] ?? '';
    if (!$id) throw new Exception('ID do usuário é obrigatório');

    $affectedRows = $db->delete("DELETE FROM users WHERE id = ? AND is_admin = 0", [$id]);
    if ($affectedRows === 0) throw new Exception('Usuário não encontrado ou é administrador');

    echo json_encode(['success' => true, 'message' => 'Usuário excluído com sucesso']);
}

function getAllUsers($db) {
    $result = $db->query("SELECT * FROM users ORDER BY created_at DESC");
    $users = [];
    while ($row = $result->fetch_assoc()) $users[] = normalizeUser($row);
    echo json_encode(['success' => true, 'data' => $users]);
}

function getUserByEmail($db) {
    $email = $_GET['email'] ?? '';
    if (!$email) throw new Exception('Email é obrigatório');

    $result = $db->query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [$email]);
    $user = null;
    if ($result->num_rows > 0) {
        $user = normalizeUser($result->fetch_assoc());
    }

    echo json_encode(['success' => true, 'data' => $user]);
}

/**
 * LOGIN: email + CPF (sem máscara)
 */
function loginUser($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $email    = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? trim($input['password']) : ''; // CPF

        if ($email === '' || $password === '') {
            throw new Exception('Email e CPF são obrigatórios');
        }

        $emailNorm = mb_strtolower($email, 'UTF-8');

        $result = $db->query("SELECT * FROM users WHERE LOWER(email) = ?", [$emailNorm]);
        if ($result->num_rows === 0) {
            throw new Exception('Email não encontrado');
        }
        $user = $result->fetch_assoc();

        $digitsOnly = function($s) { return preg_replace('/\D+/', '', (string)$s); };
        $cpfBanco   = $digitsOnly($user['cpf'] ?? '');
        $cpfEntrada = $digitsOnly($password);

        if ($cpfBanco === '' || $cpfEntrada === '' || !hash_equals($cpfBanco, $cpfEntrada)) {
            throw new Exception('Senha incorreta');
        }

        $isAdmin = !empty($user['is_admin']) && (int)$user['is_admin'] === 1;
        if (!$isAdmin && !empty($user['access_expires_at'])) {
            $now = new DateTime('now');
            $expires = new DateTime($user['access_expires_at']);
            if ($now > $expires) {
                throw new Exception('Acesso expirado. Entre em contato para renovar.');
            }
        }

        $db->update("UPDATE users SET last_login = NOW() WHERE id = ?", [$user['id']]);

        echo json_encode([
            'success' => true,
            'data' => normalizeUser($user),
            'message' => 'Login realizado com sucesso'
        ]);
    } catch (Exception $e) {
        error_log("Erro no login: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function changePassword($db) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Recurso indisponível: autenticação é feita por email + CPF.']);
}

function deleteMultipleUsers($db) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $ids = $input['ids'] ?? [];
    if (empty($ids)) throw new Exception('IDs dos usuários são obrigatórios');

    $placeholders = str_repeat('?,', count($ids) - 1) . '?';
    $affectedRows = $db->delete("DELETE FROM users WHERE id IN ($placeholders) AND is_admin = 0", $ids);

    echo json_encode(['success' => true, 'message' => 'Usuários excluídos com sucesso', 'deleted_count' => $affectedRows]);
}

function renewMultipleUsers($db) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $ids = $input['ids'] ?? [];
    if (empty($ids)) throw new Exception('IDs dos usuários são obrigatórios');

    $newExpiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
    $placeholders = str_repeat('?,', count($ids) - 1) . '?';
    $params = array_merge([$newExpiresAt], $ids);

    $affectedRows = $db->update("UPDATE users SET access_expires_at = ? WHERE id IN ($placeholders)", $params);

    echo json_encode(['success' => true, 'message' => 'Usuários renovados com sucesso', 'renewed_count' => $affectedRows]);
}

function changeMultipleUsersPlans($db) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $ids = $input['ids'] ?? [];
    $licenseCount = $input['license_count'] ?? 1;
    if (empty($ids)) throw new Exception('IDs dos usuários são obrigatórios');

    $placeholders = str_repeat('?,', count($ids) - 1) . '?';
    $params = array_merge([$licenseCount], $ids);
    $affectedRows = $db->update("UPDATE users SET license_count = ? WHERE id IN ($placeholders)", $params);

    echo json_encode(['success' => true, 'message' => 'Planos alterados com sucesso', 'updated_count' => $affectedRows]);
}

function sendWelcomeEmail($email, $name, $loginEmail, $password, $type) {
    $whatsappNumber = '5517997815756';
    $whatsappLink = "https://wa.me/{$whatsappNumber}";
    $emailData = [
        'to' => $email,
        'name' => $name,
        'type' => $type,
        'login_email' => $loginEmail,
        'whatsapp_link' => $whatsappLink,
        'whatsapp_number' => $whatsappNumber
    ];

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'profetadedeus.com.br';
    $apiUrl = "{$protocol}://{$host}/kids/api/send-email.php";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    error_log("Email enviado para {$email} - Tipo: {$type} - HTTP: {$httpCode}");
}