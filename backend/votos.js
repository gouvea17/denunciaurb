const express = require('express');
const router = express.Router();
const db = require('../database'); // seu arquivo de conexão com MySQL
const jwt = require('jsonwebtoken');

// Middleware para verificar token
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (erro) {
        return res.status(403).json({ erro: 'Token inválido' });
    }
}

// Registrar um apoio/voto em uma denúncia
router.post('/denuncias/:id/votar', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const emailUsuario = req.usuario.email;
    
    try {
        // Verifica se usuário já votou nesta denúncia
        const [jaVotou] = await db.query(
            'SELECT * FROM votos WHERE denuncia_id = ? AND usuario_email = ?',
            [id, emailUsuario]
        );
        
        if (jaVotou.length > 0) {
            return res.status(400).json({ erro: 'Você já apoiou esta denúncia' });
        }
        
        // Registra o voto
        await db.query(
            'INSERT INTO votos (denuncia_id, usuario_email, data_voto) VALUES (?, ?, NOW())',
            [id, emailUsuario]
        );
        
        // Atualiza contador na tabela denuncias
        await db.query(
            'UPDATE denuncias SET votos = votos + 1 WHERE id = ?',
            [id]
        );
        
        // Busca o novo total de votos
        const [resultado] = await db.query('SELECT votos FROM denuncias WHERE id = ?', [id]);
        
        res.json({ 
            mensagem: 'Apoio registrado com sucesso!',
            votos: resultado[0].votos
        });
        
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar apoio' });
    }
});

// Buscar total de votos de uma denúncia
router.get('/denuncias/:id/votos', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [resultado] = await db.query('SELECT votos FROM denuncias WHERE id = ?', [id]);
        res.json({ votos: resultado[0]?.votos || 0 });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar votos' });
    }
});

module.exports = router;