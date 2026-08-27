<?php
/**
 * Validator Utility
 * 
 * Validates input data for all API endpoints
 */

class Validator {
    private static $errors = [];

    /**
     * Validate email format
     * 
     * @param string $email
     * @return bool
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate password strength
     * 
     * @param string $password
     * @return bool
     */
    public static function isValidPassword($password) {
        // Minimum 8 characters
        return strlen($password) >= 8;
    }

    /**
     * Validate date format (Y-m-d)
     * 
     * @param string $date
     * @return bool
     */
    public static function isValidDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Validate time format (H:i)
     * 
     * @param string $time
     * @return bool
     */
    public static function isValidTime($time) {
        $t = DateTime::createFromFormat('H:i', $time);
        return $t && $t->format('H:i') === $time;
    }

    /**
     * Validate that date is not in the past
     * 
     * @param string $date
     * @return bool
     */
    public static function isDateNotPast($date) {
        $today = date('Y-m-d');
        return strtotime($date) >= strtotime($today);
    }

    /**
     * Validate that end time is after start time
     * 
     * @param string $startTime
     * @param string $endTime
     * @return bool
     */
    public static function isEndTimeAfterStartTime($startTime, $endTime) {
        return strtotime($endTime) > strtotime($startTime);
    }

    /**
     * Validate registration data
     * 
     * @param array $data
     * @return bool
     */
    public static function validateRegistration($data) {
        self::$errors = [];

        // Validate nome_artistico
        if (empty($data['nome_artistico']) || strlen($data['nome_artistico']) < 3) {
            self::$errors['nome_artistico'] = 'Nome artístico deve ter pelo menos 3 caracteres';
        }

        // Validate email
        if (empty($data['email'])) {
            self::$errors['email'] = 'E-mail é obrigatório';
        } elseif (!self::isValidEmail($data['email'])) {
            self::$errors['email'] = 'E-mail inválido';
        }

        // Validate password
        if (empty($data['senha'])) {
            self::$errors['senha'] = 'Senha é obrigatória';
        } elseif (!self::isValidPassword($data['senha'])) {
            self::$errors['senha'] = 'Senha deve ter pelo menos 8 caracteres';
        }

        // Validate password confirmation
        if (($data['senha'] ?? '') !== ($data['confirmar_senha'] ?? '')) {
            self::$errors['confirmar_senha'] = 'As senhas não conferem';
        }

        return empty(self::$errors);
    }

    /**
     * Validate login data
     * 
     * @param array $data
     * @return bool
     */
    public static function validateLogin($data) {
        self::$errors = [];

        if (empty($data['email'])) {
            self::$errors['email'] = 'E-mail é obrigatório';
        }

        if (empty($data['senha'])) {
            self::$errors['senha'] = 'Senha é obrigatória';
        }

        return empty(self::$errors);
    }

    /**
     * Validate reservation data
     * 
     * @param array $data
     * @return bool
     */
    public static function validateReservation($data) {
        self::$errors = [];

        // Validate estacao_id
        if (empty($data['estacao_id']) || !is_numeric($data['estacao_id'])) {
            self::$errors['estacao_id'] = 'Estação é obrigatória';
        }

        // Validate data
        if (empty($data['data'])) {
            self::$errors['data'] = 'Data é obrigatória';
        } elseif (!self::isValidDate($data['data'])) {
            self::$errors['data'] = 'Formato de data inválido (use Y-m-d)';
        } elseif (!self::isDateNotPast($data['data'])) {
            self::$errors['data'] = 'Data não pode ser anterior a hoje';
        }

        // Validate horario_inicio
        if (empty($data['horario_inicio'])) {
            self::$errors['horario_inicio'] = 'Horário de início é obrigatório';
        } elseif (!self::isValidTime($data['horario_inicio'])) {
            self::$errors['horario_inicio'] = 'Formato de horário inválido (use H:i)';
        }

        // Validate horario_fim
        if (empty($data['horario_fim'])) {
            self::$errors['horario_fim'] = 'Horário de término é obrigatório';
        } elseif (!self::isValidTime($data['horario_fim'])) {
            self::$errors['horario_fim'] = 'Formato de horário inválido (use H:i)';
        } elseif (!self::isEndTimeAfterStartTime($data['horario_inicio'], $data['horario_fim'])) {
            self::$errors['horario_fim'] = 'Horário final deve ser maior que o horário inicial';
        }

        return empty(self::$errors);
    }

    /**
     * Get validation errors
     * 
     * @return array
     */
    public static function getErrors() {
        return self::$errors;
    }

    /**
     * Add a custom error
     * 
     * @param string $field
     * @param string $message
     */
    public static function addError($field, $message) {
        self::$errors[$field] = $message;
    }

    /**
     * Clear all errors
     */
    public static function clearErrors() {
        self::$errors = [];
    }
}
