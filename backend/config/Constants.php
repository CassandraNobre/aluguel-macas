<?php
/**
 * Application Constants
 * 
 * Define all constants used throughout the application
 */

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'inkstation');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');

// Session Configuration
define('SESSION_TIMEOUT', 3600); // 1 hour
define('TOKEN_EXPIRY', 86400 * 7); // 7 days
define('TOKEN_LENGTH', 32);

// CORS Configuration
define('ALLOWED_ORIGINS', ['http://localhost:4200', 'http://localhost:3000', 'http://localhost']);

// Error Messages
const ERROR_MESSAGES = [
    'INVALID_EMAIL' => 'E-mail inválido',
    'EMAIL_EXISTS' => 'E-mail já registrado',
    'INVALID_PASSWORD' => 'Senha deve ter pelo menos 8 caracteres',
    'PASSWORD_MISMATCH' => 'As senhas não conferem',
    'INVALID_CREDENTIALS' => 'E-mail ou senha incorretos',
    'UNAUTHORIZED' => 'Usuário não autenticado',
    'FORBIDDEN' => 'Sem permissão para acessar este recurso',
    'NOT_FOUND' => 'Registro não encontrado',
    'CONFLICT' => 'Conflito de dados',
    'VALIDATION_ERROR' => 'Erro na validação dos dados',
    'INTERNAL_ERROR' => 'Erro interno do servidor',
    'INVALID_DATA' => 'Dados inválidos',
    'SCHEDULE_CONFLICT' => 'Conflito de horário nesta data',
    'STATION_NOT_ACTIVE' => 'Estação não está ativa',
    'INVALID_DATE' => 'Data não pode ser anterior a hoje',
    'INVALID_TIME_RANGE' => 'Horário final deve ser maior que o horário inicial',
    'RESERVATION_NOT_CANCELLABLE' => 'Esta reserva não pode ser cancelada',
    'UNIQUE_EMAIL' => 'Este e-mail já está registrado no sistema',
];

// Success Messages
const SUCCESS_MESSAGES = [
    'USER_CREATED' => 'Usuário criado com sucesso',
    'LOGIN_SUCCESS' => 'Login realizado com sucesso',
    'LOGOUT_SUCCESS' => 'Logout realizado com sucesso',
    'RESERVATION_CREATED' => 'Reserva criada com sucesso',
    'RESERVATION_CANCELLED' => 'Reserva cancelada com sucesso',
    'RESERVATION_UPDATED' => 'Reserva atualizada com sucesso',
];

// HTTP Status Codes
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_INTERNAL_ERROR = 500;

// Reservation Statuses
const RESERVATION_STATUSES = ['confirmada', 'pendente', 'concluida', 'cancelada'];
const CANCELLABLE_STATUSES = ['confirmada', 'pendente'];

// Date and Time Formats
define('DATE_FORMAT', 'Y-m-d');
define('TIME_FORMAT', 'H:i');
define('DATETIME_FORMAT', 'Y-m-d H:i:s');
