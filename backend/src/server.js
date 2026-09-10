// ROTA PARA BUSCAR AS RESERVAS SALVAS NO BANCO
api.get('/reservas', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT
               r.id,
               r.usuario_id,
               r.nome_cliente,
               r.estacao_id,
               r.entrada_data   AS data,
               r.entrada_hora   AS horario_inicio,
               r.saida_hora     AS horario_fim,
               r.status,
               r.observacoes,
               r.forma_pagamento,
               e.nome           AS estacao_nome,
               e.preco          AS estacao_preco,
               ROUND(
                 EXTRACT(EPOCH FROM (r.saida_hora::time - r.entrada_hora::time)) / 3600.0
                 * e.preco, 2
               )                AS valor_total
             FROM reservas r
             LEFT JOIN estacoes e ON r.estacao_id = e.id
             ORDER BY r.entrada_data DESC, r.entrada_hora DESC`
        );

        // Trata o retorno para suportar tanto PostgreSQL (result.rows) quanto arrays diretos
        const rows = Array.isArray(result) ? result : (result?.rows || []);

        const formatarData = (d) => {
            if (!d) return null;
            if (d instanceof Date) {
                const ano = d.getUTCFullYear();
                const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
                const dia = String(d.getUTCDate()).padStart(2, '0');
                return `${ano}-${mes}-${dia}`;
            }
            return String(d).slice(0, 10);
        };

        const formatarHora = (h) => {
            if (!h) return null;
            return String(h).slice(0, 5); // HH:MM
        };

        const reservasFormatadas = rows.map(row => ({
            ...row,
            data:           formatarData(row.data),
            horario_inicio: formatarHora(row.horario_inicio),
            horario_fim:    formatarHora(row.horario_fim),
            nome_cliente:   row.nome_cliente   ?? null,
            forma_pagamento:row.forma_pagamento ?? 'PIX',
            status:         (row.status || 'CONFIRMADA').toUpperCase(),
            valor_total:    row.valor_total != null ? Number(row.valor_total) : null,
        }));

        return resposta(res, 200, 'Reservas carregadas', reservasFormatadas);
    } catch (error) {
        console.error('Erro ao listar reservas:', error);
        return resposta(res, 500, 'Erro interno ao listar reservas');
    }
});