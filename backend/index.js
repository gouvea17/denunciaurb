const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const path = require('path')
const db = require('./db')

const app = express()
const porta = 3000

app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, 'frontend')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
})

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'))
})

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'register.html'))
})

app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'home.html'))
})

// API: Cadastro (sem nome)
app.post('/usuarios', async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({ erro: "Email e senha são obrigatórios" })
    }

    const hash = await bcrypt.hash(senha, 10)

    db.query(
        `INSERT INTO usuarios (email, senha) VALUES (?, ?)`,
        [email, hash],
        (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ erro: "Email já cadastrado!" })
                }
                return res.status(500).json({ erro: "Erro ao cadastrar usuário" })
            }
            res.json({ msg: "Usuário cadastrado com sucesso" })
        }
    )
})

// API: Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({ erro: "Email e senha são obrigatórios" })
    }

    db.query(
        `SELECT * FROM usuarios WHERE email = ?`,
        [email],
        async (err, resultados) => {
            if (err) {
                console.error('Erro no banco:', err)
                return res.status(500).json({ erro: "Erro no servidor" })
            }
            
            if (resultados.length === 0) {
                return res.status(404).json({ erro: "Usuário não encontrado" })
            }
            
            const usuario = resultados[0]
            const senhaValida = await bcrypt.compare(senha, usuario.senha)

            if (!senhaValida) {
                return res.status(401).json({ erro: "Senha incorreta" })
            }

            const token = "token-" + usuario.id

            res.json({
                msg: "Login realizado com sucesso",
                token: token
            })
        }
    )
})

app.listen(porta, () => {
    console.log("Servidor rodando na porta " + porta)
    console.log("Acesse: http://localhost:3000")
})