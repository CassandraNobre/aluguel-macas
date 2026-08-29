<?php
/**
 * Authentication Controller
 * 
 * Handles user authentication endpoints
 */

class AuthController {
    
    /**
     * Handle authentication requests
     * 
     * @param string $action
     * @param string $method
     */
    public static function handleRequest($action, $method) {
        switch ($action) {
            case 'register':
                if ($method === 'POST') {
                    self::register();
                }
                break;

            case 'login':
                if ($method === 'POST') {
                    self::login();
                }
                break;

            case 'logout':
                if ($method === 'POST') {
                    self::logout();
                }
                break;

            case 'me':
                if ($method === 'GET') {
                    self::getCurrentUser();
                }
                break;

            case 'google':
                if ($method === 'POST') {
                    self::googleLogin();
                }
                break;

            default:
                ResponseHandler::notFound();
        }
    }

    /**
     * Register new user
     */
    private static function register() {
        $data = ResponseHandler::getRequestBody();

        // Validate input
        if (!Validator::validateRegistration($data)) {
            ResponseHandler::validationError(Validator::getErrors());
        }

        // Check if email already exists
        $query = 'SELECT id FROM usuarios WHERE email = :email';
        $existing = Database::fetch($query, ['email' => $data['email']]);
        
        if ($existing) {
            ResponseHandler::conflict(ERROR_MESSAGES['EMAIL_EXISTS']);
        }

        // Hash password
        $passwordHash = Auth::hashPassword($data['senha']);

        // Insert user
        $query = 'INSERT INTO usuarios (nome_artistico, email, senha_hash, created_at, updated_at) 
                  VALUES (:nome_artistico, :email, :senha_hash, NOW(), NOW())';
        
        try {
            Database::prepare($query, [
                'nome_artistico' => $data['nome_artistico'],
                'email' => $data['email'],
                'senha_hash' => $passwordHash
            ]);

            $userId = Database::lastInsertId();

            // Authenticate user
            Auth::authenticate($userId);

            // Get user data
            $user = Database::fetch('SELECT id, nome_artistico, email, created_at FROM usuarios WHERE id = :id', ['id' => $userId]);

            ResponseHandler::success($user, 201, SUCCESS_MESSAGES['USER_CREATED']);

        } catch (Exception $e) {
            error_log('Registration error: ' . $e->getMessage());
            ResponseHandler::error('Erro ao criar usuário', 500);
        }
    }

    /**
     * User login
     */
    private static function login() {
        $data = ResponseHandler::getRequestBody();

        // Validate input
        if (!Validator::validateLogin($data)) {
            ResponseHandler::validationError(Validator::getErrors());
        }

        // Get user by email
        $query = 'SELECT id, nome_artistico, email, senha_hash FROM usuarios WHERE email = :email';
        $user = Database::fetch($query, ['email' => $data['email']]);

        if (!$user || !Auth::verifyPassword($data['senha'], $user['senha_hash'])) {
            ResponseHandler::error(ERROR_MESSAGES['INVALID_CREDENTIALS'], 401);
        }

        // Authenticate user
        Auth::authenticate($user['id']);

        // Generate token
        $token = Auth::generateToken($user['id']);

        $response = [
            'user' => [
                'id' => $user['id'],
                'nome_artistico' => $user['nome_artistico'],
                'email' => $user['email']
            ],
            'token' => $token
        ];

        ResponseHandler::success($response, 200, SUCCESS_MESSAGES['LOGIN_SUCCESS']);
    }

    /**
     * User logout
     */
    private static function logout() {
        if (!Auth::isAuthenticated()) {
            ResponseHandler::unauthorized();
        }

        Auth::logout();
        ResponseHandler::success(null, 200, SUCCESS_MESSAGES['LOGOUT_SUCCESS']);
    }

    /**
     * Get current authenticated user
     */
    private static function getCurrentUser() {
        if (!Auth::isAuthenticated()) {
            ResponseHandler::unauthorized();
        }

        $user = Auth::getUser();
        ResponseHandler::success($user, 200);
    }

    /**
     * Google OAuth login
     * 
     * Note: This endpoint is prepared but requires Google OAuth setup
     */
    private static function googleLogin() {
        $data = ResponseHandler::getRequestBody();

        if (empty($data['google_token'])) {
            ResponseHandler::validationError(['google_token' => 'Token do Google é obrigatório']);
        }

        // TODO: Verify Google token with Google's servers
        // TODO: Get user info from Google token
        // TODO: Create or update user in database

        ResponseHandler::error('Integração com Google não configurada ainda', 501);
    }
}
