// js/perfil.js
document.addEventListener('DOMContentLoaded', () => {

    // Busca o usuário logado que salvamos no localStorage
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    // Se não tiver usuário logado, barra o acesso e joga para o login
    if (!usuarioLogado) {
        alert("Acesso restrito. Por favor, faça login.");
        window.location.href = "./login.html";
        return;
    }

    let usuario;

    // Protege contra erro caso o JSON salvo esteja inválido
    try {
        usuario = JSON.parse(usuarioLogado);
    } catch (e) {
        console.error("Erro ao ler dados do usuário:", e);
        localStorage.removeItem('usuarioLogado');
        alert("Sessão inválida. Por favor, faça login novamente.");
        window.location.href = "./login.html";
        return;
    }

    // Substitui os textos do HTML com os dados reais
    document.getElementById('perfilNome').textContent = usuario.nome || "Usuário do Portal";
    document.getElementById('perfilEmail').textContent = usuario.email || "";

    // Exibe a foto do usuário (se tiver)
    const perfilFoto = document.getElementById('perfilFoto');
    if (perfilFoto) {
        if (usuario.foto_url) {
            perfilFoto.innerHTML =
                `<img src="${usuario.foto_url}" alt="Foto de ${usuario.nome}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            // Mostra a inicial do nome quando não há foto
            const inicial = (usuario.nome || "U").charAt(0).toUpperCase();
            perfilFoto.textContent = inicial;
        }
    }

    // Configuração do botão de logout
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado'); // Limpa o login
            alert("Sessão encerrada.");
            window.location.href = "./index.html"; // Volta para a home
        });
    }

});
