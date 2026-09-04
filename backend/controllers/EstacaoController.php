<?php
/**
 * Estacoes Controller
 * 
 * Handles workstation endpoints
 */

class EstacaoController {
    
    /**
     * Handle estacoes requests
     * 
     * @param string $action
     * @param string $method
     * @param int $id
     */
    public static function handleRequest($action, $method, $id) {
        // If action is a number, it's the ID
        if (is_numeric($action)) {
            $id = $action;
            $action = null;
        }

        if ($action === null || $action === '') {
            if ($method === 'GET') {
                if ($id) {
                    self::getById($id);
                } else {
                    self::getAll();
                }
            }
        } elseif ($action === 'disponibilidade' && is_numeric($id)) {
            if ($method === 'GET') {
                self::getAvailability($id);
            }
        } else {
            ResponseHandler::notFound();
        }
    }

    /**
     * Get all workstations
     */
    private static function getAll() {
        $query = 'SELECT id, nome, categoria, descricao, preco, imagem_url, recursos, ativa, created_at 
                  FROM estacoes 
                  WHERE ativa = 1 
                  ORDER BY nome ASC';
        
        $estacoes = Database::fetchAll($query);
        
        // Parse JSON fields e garantir o nome da chave
        foreach ($estacoes as &$estacao) {
            $estacao['recursos'] = json_decode($estacao['recursos'], true) ?? [];
            // Garantir que preco exista
            if (isset($estacao['preco_por_hora']) && !isset($estacao['preco'])) {
                $estacao['preco'] = $estacao['preco_por_hora'];
                unset($estacao['preco_por_hora']);
            }
        }

        ResponseHandler::success($estacoes, 200);
    }

    /**
     * Get workstation by ID
     * 
     * @param int $id
     */
    private static function getById($id) {
        if (!is_numeric($id)) {
            ResponseHandler::notFound();
        }

        $query = 'SELECT id, nome, categoria, descricao, preco, imagem_url, recursos, ativa, created_at, updated_at 
                  FROM estacoes 
                  WHERE id = :id AND ativa = 1';
        
        $estacao = Database::fetch($query, ['id' => $id]);

        if (!$estacao) {
            ResponseHandler::notFound();
        }

        $estacao['recursos'] = json_decode($estacao['recursos'], true) ?? [];
        
        // Garantir que preco exista
        if (isset($estacao['preco_por_hora']) && !isset($estacao['preco'])) {
            $estacao['preco'] = $estacao['preco_por_hora'];
            unset($estacao['preco_por_hora']);
        }
        
        ResponseHandler::success($estacao, 200);
    }

    /**
     * Get workstation availability for a specific date
     * 
     * @param int $estacaoId
     */
    private static function getAvailability($estacaoId) {
        // Get date from query parameter
        $data = ResponseHandler::getQuery('data');
        
        if (!$data || !Validator::isValidDate($data)) {
            ResponseHandler::validationError(['data' => 'Data em formato inválido (use Y-m-d)']);
        }

        // Check if workstation exists and is active
        $estacao = Database::fetch('SELECT id FROM estacoes WHERE id = :id AND ativa = 1', ['id' => $estacaoId]);
        
        if (!$estacao) {
            ResponseHandler::notFound();
        }

        // Get all reservations for this workstation on this date
        $query = 'SELECT horario_inicio, horario_fim 
                  FROM reservas 
                  WHERE estacao_id = :estacao_id 
                  AND data = :data 
                  AND status IN (?, ?)';
        
        // Need to use PDO for IN clause
        $connection = Database::connect();
        $stmt = $connection->prepare('SELECT horario_inicio, horario_fim 
                  FROM reservas 
                  WHERE estacao_id = :estacao_id 
                  AND data = :data 
                  AND status IN (?, ?)');
        
        $stmt->execute([
            ':estacao_id' => $estacaoId,
            ':data' => $data,
            'confirmada',
            'pendente'
        ]);
        
        $reservas = $stmt->fetchAll();

        // Build availability array
        $availability = [
            'data' => $data,
            'estacao_id' => $estacaoId,
            'horarios_ocupados' => $reservas,
            'horarios_disponiveis' => self::calculateAvailableSlots($reservas)
        ];

        ResponseHandler::success($availability, 200);
    }

    /**
     * Calculate available time slots
     * 
     * @param array $reservas
     * @return array
     */
    private static function calculateAvailableSlots($reservas) {
        $day_start = '08:00';
        $day_end = '22:00';
        $slot_duration = 60; // minutes

        // Convert reservations to timestamps for easier comparison
        $occupied = [];
        foreach ($reservas as $reserva) {
            $occupied[] = [
                'start' => strtotime($reserva['horario_inicio']),
                'end' => strtotime($reserva['horario_fim'])
            ];
        }

        // Sort occupied slots
        usort($occupied, function($a, $b) {
            return $a['start'] - $b['start'];
        });

        // Build available slots
        $available = [];
        $current = strtotime($day_start);
        $end = strtotime($day_end);

        foreach ($occupied as $slot) {
            // Add slot before this reservation
            if ($current < $slot['start']) {
                $available[] = [
                    'inicio' => date('H:i', $current),
                    'fim' => date('H:i', $slot['start'])
                ];
            }
            $current = max($current, $slot['end']);
        }

        // Add final slot
        if ($current < $end) {
            $available[] = [
                'inicio' => date('H:i', $current),
                'fim' => date('H:i', $end)
            ];
        }

        return $available;
    }
}
