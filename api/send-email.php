
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configurações de email
$smtp_host = 'mail.profetadedeus.com.br';
$smtp_port = 587;
$smtp_username = 'noreply@profetadedeus.com.br';
$smtp_password = 'noreply@2024';
$from_email = 'noreply@profetadedeus.com.br';
$from_name = 'Profeta de Deus Kids';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Dados inválidos');
    }
    
    $to = $input['to'] ?? '';
    $name = $input['name'] ?? '';
    $type = $input['type'] ?? 'create';
    $loginEmail = $input['login_email'] ?? '';
    $password = $input['password'] ?? '';
    $whatsappLink = $input['whatsapp_link'] ?? '';
    $whatsappNumber = $input['whatsapp_number'] ?? '';
    
    if (!$to || !$name) {
        throw new Exception('Email e nome são obrigatórios');
    }
    
    // Definir assunto e conteúdo baseado no tipo
    switch ($type) {
        case 'create':
            $subject = '🎉 Bem-vindo ao Profeta de Deus Kids!';
            $message = createWelcomeEmailContent($name, $loginEmail, $password, $whatsappLink, $whatsappNumber);
            break;
            
        case 'update':
            $subject = '📝 Seus dados foram atualizados - Profeta de Deus Kids';
            $message = createUpdateEmailContent($name, $loginEmail, $whatsappLink, $whatsappNumber);
            break;
            
        case 'renew':
            $subject = '🔄 Sua licença foi renovada - Profeta de Deus Kids';
            $message = createRenewalEmailContent($name, $loginEmail, $whatsappLink, $whatsappNumber);
            break;
            
        default:
            throw new Exception('Tipo de email inválido');
    }
    
    // Enviar email usando PHPMailer ou função mail() nativa
    if (sendEmail($to, $name, $subject, $message)) {
        echo json_encode(['success' => true, 'message' => 'Email enviado com sucesso']);
    } else {
        throw new Exception('Falha ao enviar email');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

function createWelcomeEmailContent($name, $email, $password, $whatsappLink, $whatsappNumber) {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .whatsapp-btn { background: #25D366; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎉 Bem-vindo ao Profeta de Deus Kids!</h1>
                <p>Sua conta foi criada com sucesso!</p>
            </div>
            
            <div class='content'>
                <h2>Olá, {$name}!</h2>
                
                <p>É com grande alegria que damos as boas-vindas ao <strong>Profeta de Deus Kids</strong>! Sua conta foi criada com sucesso e você já pode começar a explorar nosso conteúdo educativo e inspirador.</p>
                
                <div class='credentials'>
                    <h3>📧 Seus dados de acesso:</h3>
                    <p><strong>Email:</strong> {$email}</p>
                    <p><strong>Senha:</strong> {$password}</p>
                    <p><strong>Link de acesso:</strong> <a href='https://www.profetadedeus.com.br/kids/login'>www.profetadedeus.com.br/kids/login</a></p>
                </div>
                
                <p><strong>⚠️ Importante:</strong> Recomendamos que você altere sua senha no primeiro acesso para maior segurança.</p>
                
                <h3>🎯 O que você pode fazer agora:</h3>
                <ul>
                    <li>📖 Explorar nossas histórias bíblicas interativas</li>
                    <li>🎥 Assistir vídeos educativos</li>
                    <li>📱 Acessar de qualquer dispositivo</li>
                    <li>👨‍👩‍👧‍👦 Compartilhar com sua família</li>
                </ul>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='https://www.profetadedeus.com.br/kids/login' class='button'>🚀 Acessar Plataforma</a>
                    <a href='{$whatsappLink}' class='button whatsapp-btn'>💬 Falar no WhatsApp</a>
                </div>
                
                <h3>📞 Precisa de ajuda?</h3>
                <p>Nossa equipe está sempre pronta para ajudar! Entre em contato conosco:</p>
                <ul>
                    <li>📱 WhatsApp: <a href='{$whatsappLink}'>{$whatsappNumber}</a></li>
                    <li>📧 Email: suporte@profetadedeus.com.br</li>
                </ul>
            </div>
            
            <div class='footer'>
                <p>Este email foi enviado automaticamente pelo sistema Profeta de Deus Kids.</p>
                <p>© 2024 Profeta de Deus. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    ";
}

function createUpdateEmailContent($name, $email, $whatsappLink, $whatsappNumber) {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .whatsapp-btn { background: #25D366; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📝 Dados Atualizados</h1>
                <p>Suas informações foram atualizadas com sucesso!</p>
            </div>
            
            <div class='content'>
                <h2>Olá, {$name}!</h2>
                
                <p>Informamos que seus dados na plataforma <strong>Profeta de Deus Kids</strong> foram atualizados com sucesso!</p>
                
                <div class='info-box'>
                    <h3>📧 Seus dados de acesso atuais:</h3>
                    <p><strong>Email:</strong> {$email}</p>
                    <p><strong>Link de acesso:</strong> <a href='https://www.profetadedeus.com.br/kids/login'>www.profetadedeus.com.br/kids/login</a></p>
                </div>
                
                <p>Se você não solicitou essa alteração ou tem alguma dúvida, entre em contato conosco imediatamente.</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='https://www.profetadedeus.com.br/kids/login' class='button'>🚀 Acessar Plataforma</a>
                    <a href='{$whatsappLink}' class='button whatsapp-btn'>💬 Falar no WhatsApp</a>
                </div>
                
                <h3>📞 Precisa de ajuda?</h3>
                <p>Nossa equipe está sempre pronta para ajudar! Entre em contato conosco:</p>
                <ul>
                    <li>📱 WhatsApp: <a href='{$whatsappLink}'>{$whatsappNumber}</a></li>
                    <li>📧 Email: suporte@profetadedeus.com.br</li>
                </ul>
            </div>
            
            <div class='footer'>
                <p>Este email foi enviado automaticamente pelo sistema Profeta de Deus Kids.</p>
                <p>© 2024 Profeta de Deus. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    ";
}

function createRenewalEmailContent($name, $email, $whatsappLink, $whatsappNumber) {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .renewal-box { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .whatsapp-btn { background: #25D366; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔄 Licença Renovada!</h1>
                <p>Sua licença foi renovada por mais 1 ano!</p>
            </div>
            
            <div class='content'>
                <h2>Olá, {$name}!</h2>
                
                <p>Temos uma excelente notícia! Sua licença do <strong>Profeta de Deus Kids</strong> foi renovada com sucesso por mais <strong>1 ano</strong>!</p>
                
                <div class='renewal-box'>
                    <h3>✅ Renovação confirmada:</h3>
                    <p><strong>Email:</strong> {$email}</p>
                    <p><strong>Período:</strong> Mais 1 ano a partir de hoje</p>
                    <p><strong>Status:</strong> Ativo</p>
                    <p><strong>Link de acesso:</strong> <a href='https://www.profetadedeus.com.br/kids/login'>www.profetadedeus.com.br/kids/login</a></p>
                </div>
                
                <h3>🎯 Continue aproveitando:</h3>
                <ul>
                    <li>📖 Todas as histórias bíblicas interativas</li>
                    <li>🎥 Vídeos educativos atualizados</li>
                    <li>📱 Acesso ilimitado de qualquer dispositivo</li>
                    <li>🆕 Novos conteúdos adicionados regularmente</li>
                </ul>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='https://www.profetadedeus.com.br/kids/login' class='button'>🚀 Acessar Plataforma</a>
                    <a href='{$whatsappLink}' class='button whatsapp-btn'>💬 Falar no WhatsApp</a>
                </div>
                
                <h3>📞 Precisa de ajuda?</h3>
                <p>Nossa equipe está sempre pronta para ajudar! Entre em contato conosco:</p>
                <ul>
                    <li>📱 WhatsApp: <a href='{$whatsappLink}'>{$whatsappNumber}</a></li>
                    <li>📧 Email: suporte@profetadedeus.com.br</li>
                </ul>
            </div>
            
            <div class='footer'>
                <p>Este email foi enviado automaticamente pelo sistema Profeta de Deus Kids.</p>
                <p>© 2024 Profeta de Deus. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    ";
}

function sendEmail($to, $name, $subject, $message) {
    global $smtp_host, $smtp_port, $smtp_username, $smtp_password, $from_email, $from_name;
    
    // Headers para email HTML
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: {$from_name} <{$from_email}>" . "\r\n";
    $headers .= "Reply-To: {$from_email}" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Tentar enviar email
    return mail($to, $subject, $message, $headers);
}
?>
