
<?php
class Database {
    private $host = 'localhost';
    private $username = 'fd427345_contato';
    private $password = 'Vsv#H[^0F0sF';
    private $database = 'fd427345_profetaKids';
    private $connection;

    public function __construct() {
        $this->connect();
    }

    private function connect() {
        try {
            $this->connection = new mysqli($this->host, $this->username, $this->password, $this->database);
            
            if ($this->connection->connect_error) {
                throw new Exception("Falha na conexão: " . $this->connection->connect_error);
            }
            
            $this->connection->set_charset("utf8mb4");
            error_log("✅ CONEXÃO COM BANCO DE DADOS ESTABELECIDA");
        } catch (Exception $e) {
            error_log("❌ ERRO NA CONEXÃO COM BANCO: " . $e->getMessage());
            throw $e;
        }
    }

    public function query($sql, $params = []) {
        try {
            if (empty($params)) {
                $result = $this->connection->query($sql);
                if (!$result) {
                    throw new Exception("Erro na query: " . $this->connection->error);
                }
                return $result;
            }

            $stmt = $this->connection->prepare($sql);
            if (!$stmt) {
                throw new Exception("Erro ao preparar statement: " . $this->connection->error);
            }

            if (!empty($params)) {
                $types = str_repeat('s', count($params));
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result === false) {
                throw new Exception("Erro ao executar query: " . $stmt->error);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("ERRO NA QUERY: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    public function insert($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            if (!$stmt) {
                throw new Exception("Erro ao preparar statement: " . $this->connection->error);
            }

            if (!empty($params)) {
                $types = str_repeat('s', count($params));
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                throw new Exception("Nenhuma linha foi inserida");
            }
            
            return $this->connection->insert_id;
        } catch (Exception $e) {
            error_log("ERRO NO INSERT: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    public function update($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            if (!$stmt) {
                throw new Exception("Erro ao preparar statement: " . $this->connection->error);
            }

            if (!empty($params)) {
                $types = str_repeat('s', count($params));
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            return $stmt->affected_rows;
        } catch (Exception $e) {
            error_log("ERRO NO UPDATE: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    public function delete($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            if (!$stmt) {
                throw new Exception("Erro ao preparar statement: " . $this->connection->error);
            }

            if (!empty($params)) {
                $types = str_repeat('s', count($params));
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            return $stmt->affected_rows;
        } catch (Exception $e) {
            error_log("ERRO NO DELETE: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    public function __destruct() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
}
?>
