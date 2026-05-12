// Gerenciamento de Denúncias com Filtro

let denunciasAtuais = [];

async function carregarDenuncias(filtro = 'todas') {
    try {
        const url = (filtro === 'todas' || !filtro) 
            ? 'http://localhost:3000/api/denuncias'
            : `http://localhost:3000/api/denuncias?status=${filtro}`;
        
        const resposta = await fetch(url);
        denunciasAtuais = await resposta.json();
        
        renderizarDenuncias(denunciasAtuais);
        
    } catch (erro) {
        console.error('Erro ao carregar denúncias:', erro);
        const container = document.getElementById('listaDenuncias');
        if (container) {
            container.innerHTML = '<p style="color: red;">Erro ao carregar denúncias. Verifique se o servidor está rodando.</p>';
        }
    }
}

function renderizarDenuncias(denuncias) {
    const container = document.getElementById('listaDenuncias');
    
    if (!container) return;
    
    if (denuncias.length === 0) {
        container.innerHTML = `
            <div class="nenhuma-denuncia">
                <p>📭 Nenhuma denúncia encontrada.</p>
                <p>Seja o primeiro a reportar um problema!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = denuncias.map(denuncia => {
        const podeResolver = denuncia.email_criador === localStorage.getItem('usuarioEmail');
        const statusClass = denuncia.status === 'pendente' ? 'status-pendente' : 'status-resolvido';
        const statusIcon = denuncia.status === 'pendente' ? '🟡' : '🟢';
        const statusText = denuncia.status === 'pendente' ? 'Pendente' : 'Resolvido';
        
        return `
            <div class="denuncia-card" data-id="${denuncia.id}">
                <div class="card-header">
                    <h3>${escapeHtml(denuncia.titulo)}</h3>
                    <span class="${statusClass}">${statusIcon} ${statusText}</span>
                </div>
                
                <p class="descricao">${escapeHtml(denuncia.descricao)}</p>
                
                <div class="card-footer">
                    <div class="votos-area">
                        <span id="votos-${denuncia.id}" class="contador-votos">🔺 ${denuncia.votos || 0} apoios</span>
                        <button class="btn-apoio" onclick="apoiarDenuncia(${denuncia.id})">
                            👍 Apoiar
                        </button>
                    </div>
                    
                    <div class="meta-info">
                        <small> ${new Date(denuncia.dataCriacao).toLocaleDateString('pt-BR')}</small>
                        <small> por ${escapeHtml(denuncia.criador_nome || 'Anônimo')}</small>
                    </div>
                    
                    ${denuncia.status === 'pendente' && podeResolver ? `
                        <button class="btn-resolver" onclick="marcarComoResolvido(${denuncia.id})">
                            ✅ Marcar como resolvida
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filtrarDenuncias() {
    const filtro = document.getElementById('filtroStatus').value;
    carregarDenuncias(filtro);
}

async function marcarComoResolvido(denunciaId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Faça login para continuar');
        window.location.href = 'login.html';
        return;
    }
    
    if (!confirm('Tem certeza que esta denúncia foi resolvida?')) {
        return;
    }
    
    try {
        const resposta = await fetch(`http://localhost:3000/api/denuncias/${denunciaId}/resolver`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const dados = await resposta.json();
        
        if (resposta.ok) {
            alert('✅ Denúncia marcada como resolvida!');
            // Recarrega a lista com o filtro atual
            const filtro = document.getElementById('filtroStatus').value;
            carregarDenuncias(filtro);
        } else {
            alert('❌ ' + (dados.erro || 'Erro ao resolver denúncia'));
        }
    } catch (erro) {
        console.error('Erro:', erro);
        alert('Erro de conexão com o servidor');
    }
}

// Função auxiliar para evitar XSS
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// Carrega denúncias quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarDenuncias('todas');
});