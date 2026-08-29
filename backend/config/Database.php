<?php
/**
 * Database Connection Handler
 * 
 * Manages PDO connection to MySQL database
 */

class Database {
    private static $connection = null;
    private static $instance = null;

    /**
     * Private constructor - singleton pattern
     */
    private function __construct() {}

    /**
     * Get database connection instance
     * 
     * @return PDO
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Connect to the database
     * 
     * @return PDO
     * @throws PDOException
     */
    public static function connect() {
        if (self::$connection === null) {
            try {
                $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
                
                self::$connection = new PDO(
                    $dsn,
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
                
                // Test the connection
                self::$connection->getAttribute(PDO::ATTR_SERVER_VERSION);
                
            } catch (PDOException $e) {
                error_log('Database Connection Error: ' . $e->getMessage());
                throw new PDOException('Erro ao conectar ao banco de dados: ' . $e->getMessage());
            }
        }
        
        return self::$connection;
    }

    /**
     * Close the database connection
     */
    public static function close() {
        self::$connection = null;
    }

    /**
     * Execute a prepared statement
     * 
     * @param string $query
     * @param array $params
     * @return PDOStatement
     * @throws PDOException
     */
    public static function prepare($query, $params = []) {
        try {
            $connection = self::connect();
            $statement = $connection->prepare($query);
            
            if (!empty($params)) {
                foreach ($params as $key => $value) {
                    $statement->bindValue(':' . $key, $value);
                }
            }
            
            $statement->execute();
            return $statement;
        } catch (PDOException $e) {
            error_log('Query Error: ' . $e->getMessage());
            throw new PDOException('Erro na execução da query: ' . $e->getMessage());
        }
    }

    /**
     * Execute a query and return all results
     * 
     * @param string $query
     * @param array $params
     * @return array
     */
    public static function fetchAll($query, $params = []) {
        $statement = self::prepare($query, $params);
        return $statement->fetchAll();
    }

    /**
     * Execute a query and return first result
     * 
     * @param string $query
     * @param array $params
     * @return array|null
     */
    public static function fetch($query, $params = []) {
        $statement = self::prepare($query, $params);
        return $statement->fetch();
    }

    /**
     * Execute a query and return the number of affected rows
     * 
     * @param string $query
     * @param array $params
     * @return int
     */
    public static function execute($query, $params = []) {
        $statement = self::prepare($query, $params);
        return $statement->rowCount();
    }

    /**
     * Get the last inserted ID
     * 
     * @return string
     */
    public static function lastInsertId() {
        return self::connect()->lastInsertId();
    }

    /**
     * Begin a transaction
     */
    public static function beginTransaction() {
        self::connect()->beginTransaction();
    }

    /**
     * Commit a transaction
     */
    public static function commit() {
        self::connect()->commit();
    }

    /**
     * Rollback a transaction
     */
    public static function rollback() {
        self::connect()->rollBack();
    }
}
