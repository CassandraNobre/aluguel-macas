<?php
/**
 * Response Handler Utility
 * 
 * Handles standardized JSON responses for all API endpoints
 */

class ResponseHandler {
    
    /**
     * Send a success response
     * 
     * @param mixed $data The data to return
     * @param int $status HTTP status code
     * @param string $message Success message
     */
    public static function success($data = null, $status = 200, $message = 'Sucesso') {
        http_response_code($status);
        echo json_encode([
            'success' => true,
            'status' => $status,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send an error response
     * 
     * @param string $message Error message
     * @param int $status HTTP status code
     * @param mixed $errors Additional error details
     */
    public static function error($message = 'Erro', $status = 400, $errors = null) {
        http_response_code($status);
        echo json_encode([
            'success' => false,
            'status' => $status,
            'message' => $message,
            'errors' => $errors
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send a validation error response
     * 
     * @param array $errors Validation errors
     */
    public static function validationError($errors) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'status' => 400,
            'message' => 'Erro na validação dos dados',
            'errors' => $errors
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send a conflict response
     * 
     * @param string $message Conflict message
     */
    public static function conflict($message = 'Conflito de dados') {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'status' => 409,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized() {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'status' => 401,
            'message' => 'Usuário não autenticado'
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send forbidden response
     */
    public static function forbidden() {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'status' => 403,
            'message' => 'Sem permissão para acessar este recurso'
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Send not found response
     */
    public static function notFound() {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'status' => 404,
            'message' => 'Registro não encontrado'
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    /**
     * Get request body as JSON
     * 
     * @return array
     */
    public static function getRequestBody() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    /**
     * Get query parameter
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getQuery($key, $default = null) {
        return $_GET[$key] ?? $default;
    }
}
