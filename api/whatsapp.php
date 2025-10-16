<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 🔧 CONFIGURAÇÕES DA EVOLUTION API
$evolution_api_url = 'http://localhost:8080'; // URL da sua Evolution API
$instance_name = 'profeta_kids'; // Nome da instância
$api_key = 'SUA_API_KEY_AQUI'; // Sua API Key da Evolution

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Dados inválidos');
    }
    
    $phone = $input['phone'] ?? '';
    $message = $input['message'] ?? '';
    $type = $input['type'] ?? 'text';
    
    if (!$phone || !$message) {
        throw new Exception('Telefone e mensagem são obrigatórios');
    }
    
    // 🔧 FORMATAR NÚMERO (remover caracteres especiais)
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // 🔧 ADICIONAR CÓDIGO DO PAÍS SE NÃO TIVER
    if (strlen($phone) === 11 && substr($phone, 0, 1) !== '55') {
        $phone = '55' . $phone;
    }
    
    // 🔧 PREPARAR DADOS PARA ENVIO
    $data = [
        'number' => $phone,
        'text' => $message
    ];
    
    // 🔧 ENVIAR MENSAGEM VIA EVOLUTION API
    $result = sendWhatsAppMessage($evolution_api_url, $instance_name, $api_key, $data);
    
    if ($result['success']) {
        echo json_encode([
            'success' => true, 
            'message' => 'Mensagem enviada com sucesso',
            'data' => $result['data']
        ]);
    } else {
        throw new Exception($result['error']);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

function sendWhatsAppMessage($api_url, $instance, $api_key, $data) {
    $url = "{$api_url}/message/sendText/{$instance}";
    
    $headers = [
        'Content-Type: application/json',
        'apikey: ' . $api_key
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'Erro cURL: ' . $error];
    }
    
    if ($http_code !== 200) {
        return ['success' => false, 'error' => 'HTTP Error: ' . $http_code];
    }
    
    $result = json_decode($response, true);
    
    if (!$result) {
        return ['success' => false, 'error' => 'Resposta inválida da API'];
    }
    
    return ['success' => true, 'data' => $result];
}

// 🔧 FUNÇÃO PARA CRIAR MENSAGENS PERSONALIZADAS
function createWelcomeWhatsAppMessage($name, $email, $password) {
    return "🎉 *Bem-vindo ao Profeta de Deus Kids!*\n\n" .
           "Olá *{$name}*! Sua conta foi criada com sucesso!\n\n" .
           "📧 *Seus dados de acesso:*\n" .
           "• Email: {$email}\n" .
           "• Senha: {$password}\n\n" .
           "🔗 *Acesse agora:*\n" .
           "www.profetadedeus.com.br/kids/login\n\n" .
           "⚠️ *Importante:* Recomendamos alterar sua senha no primeiro acesso.\n\n" .
           "Precisa de ajuda? Responda esta mensagem! 😊";
}

function createUpdateWhatsAppMessage($name, $email) {
    return "📝 *Dados Atualizados - Profeta de Deus Kids*\n\n" .
           "Olá *{$name}*!\n\n" .
           "Seus dados foram atualizados com sucesso!\n\n" .
           "📧 *Email atual:* {$email}\n" .
           "🔗 *Acesse:* www.profetadedeus.com.br/kids/login\n\n" .
           "Se você não solicitou essa alteração, entre em contato conosco imediatamente.\n\n" .
           "Precisa de ajuda? Responda esta mensagem! 😊";
}

function createRenewalWhatsAppMessage($name, $email) {
    return "🔄 *Licença Renovada - Profeta de Deus Kids*\n\n" .
           "Olá *{$name}*!\n\n" .
           "Sua licença foi renovada por mais *1 ano*! 🎉\n\n" .
           "📧 *Email:* {$email}\n" .
           "🔗 *Acesse:* www.profetadedeus.com.br/kids/login\n\n" .
           "Continue aproveitando todo nosso conteúdo educativo!\n\n" .
           "Precisa de ajuda? Responda esta mensagem! 😊";
}
?>