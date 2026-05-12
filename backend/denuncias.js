const express = require('express');
const router = express.Router();
const db = require('../db'); // Ajuste conforme sua conexão com banco

// ==================== ROTAS DE DENÚNCIAS ====================

// GET /api/denuncias - Buscar todas as denúncias (com filtro opcional)
router.get('/denuncias', async (req, res) => {
    const { status } = req.query;
    
    try {
        let query = `
            SELECT d.*, u.nome as criador_nome 
            FROM denuncias d 
            LEFT JOIN usuarios u ON d.usuario_id = u.id 
            WHERE 1=1
        `;
        const params = [];
        
        // Adiciona filtro de status se for fornecido
        if (status && status !== 'todos' && status !== 'undefined') {
            query += ` AND d.status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY d.created_at DESC`;
        
        const [rows] = await db.query(query, params);
        
        res.json({
            success: true,
            denuncias: rows,
            total: rows.length
        });
    } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar denúncias',
            details: error.message 
        });
    }
});

// GET /api/denuncias/:id - Buscar uma denúncia específica
router.get('/denuncias/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [rows] = await db.query(
            `SELECT d.*, u.nome as criador_nome 
             FROM denuncias d 
             LEFT JOIN usuarios u ON d.usuario_id = u.id 
             WHERE d.id = ?`,
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar denúncia:', error);
        res.status(500).json({ error: 'Erro ao buscar denúncia' });
    }
});

// POST /api/denuncias - Criar nova denúncia
router.post('/denuncias', async (req, res) => {
    const { titulo, descricao, localizacao, categoria, usuario_id } = req.body;
    
    if (!titulo || !descricao) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }
    
    try {
        const [result] = await db.query(
            `INSERT INTO denuncias (usuario_id, titulo, descricao, localizacao, categoria, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'pendente', NOW())`,
            [usuario_id || 1, titulo, descricao, localizacao || null, categoria || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Denúncia criada com sucesso!',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erro ao criar denúncia:', error);
        res.status(500).json({ error: 'Erro ao criar denúncia' });
    }
});

// PATCH /api/denuncias/:id/resolver - Marcar denúncia como resolvida
router.patch('/denuncias/:id/resolver', async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.body.usuario_id;
    const isAdmin = req.body.isAdmin || false;
    
    try {
        // Verifica se a denúncia existe
        const [denuncia] = await db.query(
            `SELECT * FROM denuncias WHERE id = ?`,
            [id]
        );
        
        if (denuncia.length === 0) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }
        
        // Verifica se o usuário é o criador ou admin
        if (denuncia[0].usuario_id !== usuario_id && !isAdmin) {
            return res.status(403).json({ 
                error: 'Apenas o criador da denúncia ou administradores podem resolver' 
            });
        }
        
        // Atualiza o status
        await db.query(
            `UPDATE denuncias SET status = 'resolvida' WHERE id = ?`,
            [id]
        );
        
        res.json({
            success: true,
            message: 'Denúncia marcada como resolvida!'
        });
    } catch (error) {
        console.error('Erro ao resolver denúncia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PATCH /api/denuncias/:id/status - Atualizar status da denúncia
router.patch('/denuncias/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const statusValidos = ['pendente', 'em_andamento', 'resolvida'];
    
    if (!statusValidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
    }
    
    try {
        await db.query(
            `UPDATE denuncias SET status = ? WHERE id = ?`,
            [status, id]
        );
        
        res.json({
            success: true,
            message: `Status atualizado para ${status}`
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/denuncias/:id - Deletar denúncia (apenas admin)
router.delete('/denuncias/:id', async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.body.isAdmin || false;
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Apenas administradores podem deletar denúncias' });
    }
    
    try {
        const [result] = await db.query(
            `DELETE FROM denuncias WHERE id = ?`,
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }
        
        res.json({
            success: true,
            message: 'Denúncia deletada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar denúncia:', error);
        res.status(500).json({ error: 'Erro ao deletar denúncia' });
    }
});

module.exports = router;