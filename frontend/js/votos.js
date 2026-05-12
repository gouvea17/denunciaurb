// Sistema de Apoios (Votos)

async function apoiarDenuncia(denunciaId) {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Você precisa estar logado para apoiar uma denúncia!');
            window.location.href = 'login.html';
            return;
        }
        
        const resposta = await fetch(`http://localhost:3000/api/denuncias/${denunciaId}/votar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const dados = await resposta.json();
        
        if (resposta.ok) {
            alert('✅ Você apoiou esta denúncia!');
            // Atualiza o contador na tela
            const contador = document.getElementById(`votos-${denunciaId}`);
            if (contador) {
                contador.innerHTML = `🔺 ${dados.votos} apoios`;
            }
            // Recarrega a lista para atualizar ordenação
            if (typeof carregarDenuncias === 'function') {
                const filtro = document.getElementById('filtroStatus')?.value || 'todas';
                carregarDenuncias(filtro);
            }
        } else if (resposta.status === 400) {
            alert('⚠️ Você já apoiou esta denúncia antes.');
        } else {
            alert('❌ ' + (dados.erro || 'Erro ao registrar apoio'));
        }
        
    } catch (erro) {
        console.error('Erro:', erro);
        alert('Erro de conexão com o servidor.');
    }
}

// Função para ordenar denúncias por votos
function ordenarPorVotos(denuncias, ordem = 'desc') {
    return [...denuncias].sort((a, b) => {
        if (ordem === 'desc') {
            return (b.votos || 0) - (a.votos || 0);
        } else {
            return (a.votos || 0) - (b.votos || 0);
        }
    });
}