<?php
/**
 * Authentication Handler
 * 
 * Manages user authentication using sessions and tokens
 */

class Auth {
    const SESSION_PREFIX = 'usuario_';
    const TOKEN_HEADER = 'Authorization';

    /**
     * Start session if not already started
     */
    public static function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /**
     * Check if user is authenticated
     * 
     * @return bool
     */
    public static function isAuthenticated() {
        self::startSession();
        
        // Check session
        if (!empty($_SESSION[self::SESSION_PREFIX . 'id'])) {
            return true;
        }

        // Check token in header
        $token = self::getTokenFromHeader();
        if ($token) {
            return self::validateToken($token);
        }

        return false;
    }

    /**
     * Get authenticated user ID
     * 
     * @return int|null
     */
    public static function getUserId() {
        self::startSession();
        
        // Check session
        if (!empty($_SESSION[self::SESSION_PREFIX . 'id'])) {
            return $_SESSION[self::SESSION_PREFIX . 'id'];
        }

        // Check token
        $token = self::getTokenFromHeader();
        if ($token) {
            $userId = self::getUserIdFromToken($token);
            if ($userId) {
                return $userId;
            }
        }

        return null;
    }

    /**
     * Get authenticated user data
     * 
     * @return array|null
     */
    public static function getUser() {
        self::startSession();
        
        $userId = self::getUserId();
        if (!$userId) {
            return null;
        }

        $query = 'SELECT id, nome_artistico, email, created_at FROM usuarios WHERE id = :id';
        $user = Database::fetch($query, ['id' => $userId]);
        return $user;
    }

    /**
     * Authenticate user (set session)
     * 
     * @param int $userId
     */
    public static function authenticate($userId) {
        self::startSession();
        
        $_SESSION[self::SESSION_PREFIX . 'id'] = $userId;
        $_SESSION[self::SESSION_PREFIX . 'authenticated_at'] = time();
    }

    /**
     * Logout user (destroy session)
     */
    public static function logout() {
        self::startSession();
        
        unset($_SESSION[self::SESSION_PREFIX . 'id']);
        unset($_SESSION[self::SESSION_PREFIX . 'authenticated_at']);
        
        // session_destroy();
    }

    /**
     * Generate authentication token
     * 
     * @param int $userId
     * @return string
     */
    public static function generateToken($userId) {
        $token = bin2hex(random_bytes(TOKEN_LENGTH));
        $hashedToken = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + TOKEN_EXPIRY);

        $query = 'INSERT INTO auth_tokens (usuario_id, token_hash, expires_at) 
                  VALUES (:usuario_id, :token_hash, :expires_at)';
        
        Database::prepare($query, [
            'usuario_id' => $userId,
            'token_hash' => $hashedToken,
            'expires_at' => $expiresAt
        ]);

        return $token;
    }

    /**
     * Validate token
     * 
     * @param string $token
     * @return bool
     */
    public static function validateToken($token) {
        $hashedToken = hash('sha256', $token);
        $now = date('Y-m-d H:i:s');

        $query = 'SELECT id FROM auth_tokens 
                  WHERE token_hash = :token_hash 
                  AND expires_at > :now 
                  LIMIT 1';
        
        $result = Database::fetch($query, [
            'token_hash' => $hashedToken,
            'now' => $now
        ]);

        return $result !== null;
    }

    /**
     * Get user ID from token
     * 
     * @param string $token
     * @return int|null
     */
    public static function getUserIdFromToken($token) {
        $hashedToken = hash('sha256', $token);
        $now = date('Y-m-d H:i:s');

        $query = 'SELECT usuario_id FROM auth_tokens 
                  WHERE token_hash = :token_hash 
                  AND expires_at > :now 
                  LIMIT 1';
        
        $result = Database::fetch($query, [
            'token_hash' => $hashedToken,
            'now' => $now
        ]);

        return $result ? $result['usuario_id'] : null;
    }

    /**
     * Revoke token
     * 
     * @param string $token
     */
    public static function revokeToken($token) {
        $hashedToken = hash('sha256', $token);
        
        $query = 'DELETE FROM auth_tokens WHERE token_hash = :token_hash';
        Database::execute($query, ['token_hash' => $hashedToken]);
    }

    /**
     * Get token from Authorization header
     * 
     * @return string|null
     */
    public static function getTokenFromHeader() {
        $headers = getallheaders();
        
        if (isset($headers[self::TOKEN_HEADER])) {
            $authHeader = $headers[self::TOKEN_HEADER];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Hash password
     * 
     * @param string $password
     * @return string
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password
     * 
     * @param string $password
     * @param string $hash
     * @return bool
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}
