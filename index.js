const express = require("express")
const cors = require("cors")
const app = express()
const porta = 3000

app.use(express.json())
app.use(cors()) // permite comunicação com front-end

// banco simples em memória
let usuarios = [
    {id:1, email:"teste@teste.com", senha:"123456"}
]
let id = 2

// CADASTRO
app.post("/usuarios", (req,res)=>{
    const {email, senha} = req.body
    if(!email || !senha){
        return res.status(400).json({erro:"Email e senha são obrigatórios"})
    }
    const existe = usuarios.find(u=>u.email === email)
    if(existe){
        return res.status(400).json({erro:"Email já cadastrado"})
    }
    const usuario = {id:id++, email, senha}
    usuarios.push(usuario)
    res.json({msg:"Cadastro realizado com sucesso!"})
})

// LISTAR USUÁRIOS
app.get("/usuarios", (req, res) => {
    res.json(usuarios)
})

// ATUALIZAR USUÁRIO
app.put("/usuarios/:id", (req, res) => {
    const { id } = req.params
    const { email, senha } = req.body
  
    const usuario = usuarios.find(u => u.id == id)
  
    if (!usuario) {
      return res.status(404).json({erro: "Usuário não encontrado"})
    }
  
    usuario.email = email || usuario.email
    usuario.senha = senha || usuario.senha
  
    res.json({msg: "Usuário atualizado"})
})

// DELETAR USUÁRIO
app.delete("/usuarios/:id", (req, res) => {
    const { id } = req.params
  
    const index = usuarios.findIndex(u => u.id == id)
  
    if (index === -1) {
      return res.status(404).json({erro: "Usuário não encontrado"})
    }
  
    usuarios.splice(index, 1)
  
    res.json({msg: "Usuário deletado"})
})

// LOGIN
app.post("/login", (req,res)=>{
    const {email, senha} = req.body
    const usuario = usuarios.find(u => u.email === email && u.senha === senha)
    if(usuario){
        res.json({msg:"Login realizado com sucesso!"})
    } else {
        res.status(401).json({erro:"Email ou senha incorretos"})
    }
})

// ESQUECI SENHA
app.post("/recuperar-senha", (req,res)=>{
    const {email} = req.body
    const usuario = usuarios.find(u => u.email === email)
    if(usuario){
        res.json({msg:`Um link de recuperação foi enviado para ${email}`})
    } else {
        res.status(404).json({erro:"Email não cadastrado"})
    }
})

app.listen(porta, ()=>{
    console.log(`Servidor rodando na porta ${porta}`)
})