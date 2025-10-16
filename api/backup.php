
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

$action = $_GET['action'] ?? '';

try {
    $db = new Database();
    
    switch ($action) {
        case 'create':
            createBackup($db);
            break;
        case 'restore':
            restoreBackup($db);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Ação inválida']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function createBackup($db) {
    $tables = ['users', 'stories', 'videos', 'user_progress', 'user_devices', 'purchase_orders'];
    $backup = "-- Backup gerado em " . date('Y-m-d H:i:s') . "\n\n";
    
    foreach ($tables as $table) {
        try {
            // Estrutura da tabela
            $createTableSql = "SHOW CREATE TABLE `$table`";
            $result = $db->query($createTableSql);
            
            if ($result && $result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $backup .= "DROP TABLE IF EXISTS `$table`;\n";
                $backup .= $row['Create Table'] . ";\n\n";
                
                // Dados da tabela
                $dataSql = "SELECT * FROM `$table`";
                $dataResult = $db->query($dataSql);
                
                if ($dataResult && $dataResult->num_rows > 0) {
                    $columns = array_keys($dataResult->fetch_assoc());
                    $dataResult->data_seek(0); // Reset pointer
                    
                    $backup .= "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES\n";
                    
                    $values = [];
                    while ($row = $dataResult->fetch_assoc()) {
                        $rowValues = [];
                        foreach ($row as $value) {
                            if ($value === null) {
                                $rowValues[] = 'NULL';
                            } else {
                                $rowValues[] = "'" . addslashes($value) . "'";
                            }
                        }
                        $values[] = "(" . implode(', ', $rowValues) . ")";
                    }
                    
                    $backup .= implode(",\n", $values) . ";\n\n";
                }
            }
        } catch (Exception $e) {
            error_log("Erro ao fazer backup da tabela $table: " . $e->getMessage());
            continue;
        }
    }
    
    // 🔧 CORRIGIDO: Retornar arquivo SQL em vez de JSON
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="backup-' . date('Y-m-d-H-i-s') . '.sql"');
    echo $backup;
    exit;
}

function restoreBackup($db) {
    if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Erro no upload do arquivo');
    }
    
    $backupContent = file_get_contents($_FILES['backup']['tmp_name']);
    
    if (empty($backupContent)) {
        throw new Exception('Arquivo de backup vazio');
    }
    
    // Dividir o backup em comandos SQL individuais
    $commands = explode(';', $backupContent);
    
    foreach ($commands as $command) {
        $command = trim($command);
        if (!empty($command) && !str_starts_with($command, '--')) {
            try {
                $db->query($command);
            } catch (Exception $e) {
                error_log("Erro ao executar comando SQL: " . $e->getMessage());
                // Continuar com próximo comando
            }
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Backup restaurado com sucesso']);
}
?>
