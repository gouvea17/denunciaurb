const API_URL = 'http://localhost:3000';

function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    if (!token && currentPage.includes('home.html')) {
        window.location.href = 'login.html';
    }
    
    if (token && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        window.location.href = 'home.html';
    }
}

function showMessage(message, isError = false) {
    const msgDiv = document.getElementById('message');
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.className = isError ? 'message error' : 'message success';
        setTimeout(() => {
            msgDiv.className = 'message';
        }, 3000);
    }
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        
        if (senha !== confirmarSenha) {
            showMessage('As senhas não coincidem!', true);
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('Cadastro realizado com sucesso! Redirecionando...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.erro || 'Erro no cadastro', true);
            }
        } catch (error) {
            showMessage('Erro de conexão com o servidor', true);
        }
    });
}

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userNome', data.nome || email.split('@')[0]);
                showMessage('Login realizado com sucesso!');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000);
            } else {
                showMessage(data.erro || 'Erro no login', true);
            }
        } catch (error) {
            showMessage('Erro de conexão com o servidor', true);
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userNome');
    window.location.href = 'login.html';
}

function loadUserData() {
    const userNome = localStorage.getItem('userNome');
    if (userNome) {
        const welcomeNome = document.getElementById('welcomeNome');
        const userNomeSpan = document.getElementById('userNome');
        if (welcomeNome) welcomeNome.textContent = userNome;
        if (userNomeSpan) userNomeSpan.textContent = `Olá, ${userNome}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
});