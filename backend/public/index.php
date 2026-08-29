<?php
/**
 * InkStation API - Main Entry Point
 * 
 * Handles all API requests with proper routing and error handling
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set response header
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Define base path
define('BASE_PATH', dirname(__DIR__) . '/');
define('CONFIG_PATH', BASE_PATH . 'config/');
define('CONTROLLERS_PATH', BASE_PATH . 'controllers/');
define('UTILS_PATH', BASE_PATH . 'utils/');

// Load configuration and dependencies
require_once CONFIG_PATH . 'Constants.php';
require_once CONFIG_PATH . 'Database.php';
require_once UTILS_PATH . 'ResponseHandler.php';
require_once UTILS_PATH . 'Validator.php';
require_once UTILS_PATH . 'Auth.php';

// Load controllers
require_once CONTROLLERS_PATH . 'AuthController.php';
require_once CONTROLLERS_PATH . 'EstacaoController.php';
require_once CONTROLLERS_PATH . 'ReservaController.php';

try {
    // Parse the URL
    $request_uri = $_SERVER['REQUEST_URI'];
    $script_name = $_SERVER['SCRIPT_NAME'];
    
    // Remove the script name from the URI
    $path = str_replace(dirname($script_name), '', $request_uri);
    if (strpos($path, '?') !== false) {
        $path = explode('?', $path)[0];
    }
    
    $path = trim($path, '/');
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Log the request
    error_log("Request: $method $path");
    
    // Route the request
    route($path, $method);
    
} catch (Exception $e) {
    http_response_code(500);
    ResponseHandler::error($e->getMessage(), 500);
}

/**
 * Route the request to the appropriate controller
 */
function route($path, $method) {
    $parts = explode('/', $path);
    
    // Remove 'api' from the path if present
    if (!empty($parts[0]) && $parts[0] === 'api') {
        array_shift($parts);
    }
    
    $resource = $parts[0] ?? '';
    $action = $parts[1] ?? '';
    $id = $parts[2] ?? null;
    
    // Route to appropriate controller
    switch ($resource) {
        case 'auth':
            AuthController::handleRequest($action, $method);
            break;
            
        case 'estacoes':
            EstacaoController::handleRequest($action, $method, $id);
            break;
            
        case 'reservas':
            ReservaController::handleRequest($action, $method, $id);
            break;
            
        default:
            http_response_code(404);
            ResponseHandler::error('Endpoint not found', 404);
    }
}
