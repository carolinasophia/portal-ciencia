document.addEventListener("DOMContentLoaded", () => {

    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (usuarioSalvo) {

        let usuario;

        // Protege contra JSON inválido
        try {
            usuario = JSON.parse(usuarioSalvo);
        } catch (e) {
            console.error("Erro ao ler dados do usuário:", e);
            localStorage.removeItem("usuarioLogado");
            return;
        }

        // Oculta os links de Login e Cadastro (apenas se existirem na página)
        const menuLogin = document.getElementById("menuLogin");
        const menuCadastro = document.getElementById("menuCadastro");

        if (menuLogin) menuLogin.style.display = "none";
        if (menuCadastro) menuCadastro.style.display = "none";

        // Mostra o perfil do usuário
        const perfilUsuario = document.getElementById("perfilUsuario");
        if (perfilUsuario) perfilUsuario.style.display = "flex";

        // Exibe o avatar (foto ou inicial)
        const avatarUsuario = document.getElementById("avatarUsuario");
        if (avatarUsuario) {
            if (usuario.foto_url) {
                avatarUsuario.innerHTML =
                    `<img src="${usuario.foto_url}" alt="Foto de ${usuario.nome}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                avatarUsuario.textContent =
                    (usuario.nome || "U").charAt(0).toUpperCase();
            }
        }

        // Exibe o nome
        const nomeUsuario = document.getElementById("nomeUsuario");
        if (nomeUsuario) nomeUsuario.textContent = usuario.nome;

        // Configura o botão de logout
        const btnLogout = document.getElementById("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", (e) => {
                e.preventDefault();

                localStorage.removeItem("usuarioLogado");
                localStorage.removeItem("token");

                window.location.href = "index.html";
            });
        }

    }

});
