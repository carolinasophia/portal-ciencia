// js/alterar-senha.js
document.addEventListener('DOMContentLoaded', () => {

    // Busca o usuário logado
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    // Se não estiver logado, manda para o login
    if (!usuarioLogado) {
        alert("Acesso restrito. Por favor, faça login.");
        window.location.href = "./login.html";
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioLogado);
    } catch (e) {
        console.error("Erro ao ler dados do usuário:", e);
        localStorage.removeItem('usuarioLogado');
        alert("Sessão inválida. Por favor, faça login novamente.");
        window.location.href = "./login.html";
        return;
    }

    // Se não tiver o id do usuário, não é possível alterar a senha
    if (!usuario.id) {
        alert("Usuário inválido. Por favor, faça login novamente.");
        window.location.href = "./login.html";
        return;
    }

    const form = document.getElementById('formAlterarSenha');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const senhaAtual = document.getElementById('senhaAtual').value.trim();
        const novaSenha = document.getElementById('novaSenha').value.trim();
        const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value.trim();

        // Validações
        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        if (novaSenha.length < 6) {
            alert('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (novaSenha !== confirmarNovaSenha) {
            alert('As novas senhas não coincidem.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/usuario/${usuario.id}/senha`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senhaAtual: senhaAtual,
                    novaSenha: novaSenha
                })
            });

            const resultado = await response.json();

            if (response.ok) {
                alert(resultado.mensagem || 'Senha alterada com sucesso!');
                form.reset();
                window.location.href = './perfil.html';
            } else {
                alert(resultado.mensagem || 'Erro ao alterar a senha.');
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Não foi possível conectar ao servidor. Verifique se ele está rodando em http://localhost:3000');
        }
    });

});
