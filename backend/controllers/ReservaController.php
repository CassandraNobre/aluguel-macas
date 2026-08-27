<?php
/**
 * Reservas Controller
 * 
 * Handles reservation endpoints with business logic
 */

class ReservaController {
    
    /**
     * Handle reservas requests
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
            } elseif ($method === 'POST') {
                self::create();
            }
        } elseif ($action === 'cancelar' && is_numeric($id)) {
            if ($method === 'PATCH') {
                self::cancel($id);
            }
        } else {
            ResponseHandler::notFound();
        }
    }

    /**
     * Get all reservations for authenticated user
     */
    private static function getAll() {
        if (!Auth::isAuthenticated()) {
            ResponseHandler::unauthorized();
        }

        $userId = Auth::getUserId();

        $query = 'SELECT r.id, r.usuario_id, r.estacao_id, e.nome as estacao_nome, 
                         r.data, r.horario_inicio, r.horario_fim, r.duracao, 
                         r.valor_total, r.observacoes, r.status, r.created_at, r.updated_at
                  FROM reservas r
                  JOIN estacoes e ON r.estacao_id = e.id
                  WHERE r.usuario_id = :usuario_id
                  ORDER BY r.data DESC, r.horario_inicio DESC';
        
        $reservas = Database::fetchAll($query, ['usuario_id' => $userId]);

        ResponseHandler::success($reservas, 200);
    }

    /**
     * Get reservation by ID
     * 
     * @param int $id
     */
    private static function getById($id) {
        if (!Auth::isAuthenticated()) {
            ResponseHandler::unauthorized();
        }

        $userId = Auth::getUserId();

        if (!is_numeric($id)) {
            ResponseHandler::notFound();
        }

        $query = 'SELECT r.id, r.usuario_id, r.estacao_id, e.nome as estacao_nome, 
                         r.data, r.horario_inicio, r.horario_fim, r.duracao, 
                         r.valor_total, r.observacoes, r.status, r.created_at, r.updated_at
                  FROM reservas r
                  JOIN estacoes e ON r.estacao_id = e.id
                  WHERE r.id = :id AND r.usuario_id = :usuario_id';
        
        $reserva = Database::fetch($query, ['id' => $id, 'usuario_id' => $userId]);

        if (!$reserva) {
            ResponseHandler::notFound();
        }

        ResponseHandler::success($reserva, 200);
    }

    /**
     * Create new reservation
     */
    private static function create() {
        if (!Auth::isAuthenticated()) {
            ResponseHandler::unauthorized();
        }

        $data = ResponseHandler::getRequestBody();
        $userId = Auth::getUserId();

        // Validate input
        if (!Validator::validateReservation($data)) {
            ResponseHandler::validationError(Validator::getErrors());
        }

        // Check if workstation exists and is active
        $estacao = Database::fetch(
            'SELECT id, preco_por_hora FROM estacoes WHERE id = :id AND ativa = 1',
            ['id' => $data['estacao_id']]
        );

        if (!$estacao) {
            ResponseHandler::error(ERROR_MESSAGES['STATION_NOT_ACTIVE'], 400);
        }

        // Calculate duration in hours
        $startTime = strtotime($data['horario_inicio']);
        $endTime = strtotime($data['horario_fim']);
        $duracao = ($endTime - $startTime) / 3600; // Convert seconds to hours

        // Calculate total value
        $valorTotal = $duracao * $estacao['preco_por_hora'];

        // Check for schedule conflicts using transaction
        Database::beginTransaction();
        
        try {
            // Lock the table to prevent race conditions
            // Check for conflicts with confirmed or pending reservations
            $conflict = Database::fetch(
                'SELECT id FROM reservas 
                 WHERE estacao_id = :estacao_id 
                 AND data = :data 
                 AND status IN (?, ?)
                 AND (
                    (horario_inicio < :horario_fim AND horario_fim > :horario_inicio)
                 )
                 LIMIT 1 FOR UPDATE',
                [
                    'estacao_id' => $data['estacao_id'],
                    'data' => $data['data'],
                    'horario_inicio' => $data['horario_inicio'],
                    'horario_fim' => $data['horario_fim']
                ]
            );

            if ($conflict) {
                Database::rollback();
                ResponseHandler::conflict(ERROR_MESSAGES['SCHEDULE_CONFLICT']);
            }

            // Insert reservation
            $query = 'INSERT INTO reservas (usuario_id, estacao_id, data, horario_inicio, horario_fim, 
                                           duracao, valor_total, observacoes, status, created_at, updated_at)
                      VALUES (:usuario_id, :estacao_id, :data, :horario_inicio, :horario_fim, 
                              :duracao, :valor_total, :observacoes, :status, NOW(), NOW())';
            
            Database::prepare($query, [
                'usuario_id' => $userId,
                'estacao_id' => $data['estacao_id'],
                'data' => $data['data'],
                'horario_inicio' => $data['horario_inicio'],
                'horario_fim' => $data['horario_fim'],
                'duracao' => $duracao,
                'valor_total' => $valorTotal,
                'observacoes' => $data['observacoes'] ?? null,
                'status' => 'confirmada'
            ]);

            $reservaId = Database::lastInsertId();

            Database::commit();

            // Fetch created reservation
            $reserva = Database::fetch(
                'SELECT id, usuario_id, estacao_id, data, horario_inicio, horario_fim, 
                        duracao, valor_total, observacoes, status, created_at, updated_at
                 FROM reservas WHERE id = :id',
                ['id' => $reservaId]
            );

            ResponseHandler::success($reserva, 201, SUCCESS_MESSAGES['RESERVATION_CREATED']);

        } catch (Exception $e) {
            Database::rollback();
            error_log('Reservation creation error: ' . $e->getMessage());
            ResponseHandler::error('Erro ao criar reserva', 500);
        }
    }

    /**
     * Cancel reservation
     * 
     * @param int $id
     */
    private static function cancel($id) {
        if (!Auth::isAuthenticated()) {
            ResponseHandler::unauthorized();
        }

        $userId = Auth::getUserId();

        if (!is_numeric($id)) {
            ResponseHandler::notFound();
        }

        // Get reservation
        $reserva = Database::fetch(
            'SELECT id, usuario_id, status FROM reservas WHERE id = :id',
            ['id' => $id]
        );

        if (!$reserva) {
            ResponseHandler::notFound();
        }

        // Check authorization
        if ($reserva['usuario_id'] !== $userId) {
            ResponseHandler::forbidden();
        }

        // Check if reservation can be cancelled
        if (!in_array($reserva['status'], CANCELLABLE_STATUSES)) {
            ResponseHandler::error(ERROR_MESSAGES['RESERVATION_NOT_CANCELLABLE'], 400);
        }

        // Update reservation status
        $query = 'UPDATE reservas SET status = :status, updated_at = NOW() WHERE id = :id';
        Database::prepare($query, ['status' => 'cancelada', 'id' => $id]);

        // Fetch updated reservation
        $updated = Database::fetch(
            'SELECT id, usuario_id, estacao_id, data, horario_inicio, horario_fim, 
                    duracao, valor_total, observacoes, status, created_at, updated_at
             FROM reservas WHERE id = :id',
            ['id' => $id]
        );

        ResponseHandler::success($updated, 200, SUCCESS_MESSAGES['RESERVATION_CANCELLED']);
    }
}
