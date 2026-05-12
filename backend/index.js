const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Banco de dados
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'denuncia_urbana_novo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: 'chave_super_secreta_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Servir arquivos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas das páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// ========== ROTA PARA BUSCAR DENÚNCIAS ==========
app.get('/denuncias', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM denuncias 
      ORDER BY dataCriacao DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar denúncias:', error);
    res.json([]);
  }
});

// ========== ROTA PARA CRIAR DENÚNCIA ==========
app.post('/denuncias', async (req, res) => {
  try {
    const { titulo, descricao, localizacao, tipo } = req.body;
    
    // Verifica se o usuário está logado
    if (!req.session.usuario) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const [result] = await pool.query(`
      INSERT INTO denuncias (titulo, descricao, localizacao, tipo, status, votos, email_criador, dataCriacao) 
      VALUES (?, ?, ?, ?, 'active', 0, ?, NOW())
    `, [titulo, descricao, localizacao, tipo, req.session.usuario.email]);
    
    res.status(201).json({ 
      success: true, 
      id: result.insertId,
      message: 'Denúncia criada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia' });
  }
});

// ========== ROTA PARA VOTAR/APOIAR DENÚNCIA ==========
app.post('/denuncias/:id/votar', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se o usuário está logado
    if (!req.session.usuario) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Incrementa os votos
    const [result] = await pool.query(`
      UPDATE denuncias SET votos = votos + 1 WHERE id = ?
    `, [id]);
    
    res.json({ success: true, message: 'Voto computado!' });
  } catch (error) {
    console.error('Erro ao votar:', error);
    res.status(500).json({ error: 'Erro ao votar' });
  }
});

// ========== ROTA DE LOGIN ==========
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(password, usuario.senha);
    
    if (senhaValida) {
      req.session.usuario = {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome
      };
      
      // Salva também no localStorage para o frontend
      res.json({ 
        success: true, 
        message: 'Login realizado',
        user: { email: usuario.email, nome: usuario.nome }
      });
    } else {
      res.status(401).json({ error: 'Email ou senha incorretos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ========== ROTA DE LOGOUT ==========
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout realizado' });
});

// ========== VERIFICAR SESSÃO ==========
app.get('/api/check-session', (req, res) => {
  if (req.session.usuario) {
    res.json({ loggedIn: true, user: req.session.usuario });
  } else {
    res.json({ loggedIn: false });
  }
});

// ========== TESTE ==========
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});