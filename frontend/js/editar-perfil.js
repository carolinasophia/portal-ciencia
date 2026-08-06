// js/editar-perfil.js
document.addEventListener('DOMContentLoaded', () => {

    // Busca o usuário logado
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    // Se não estiver logado, manda para o login
    if (!usuarioLogado) {
        alert("Acesso restrito. Por favor, faça login.");
        window.location.href = "./login.html";
        return;
    }

    const usuario = JSON.parse(usuarioLogado);

    const nomeInput = document.getElementById('editarNome');
    const emailSpan = document.getElementById('editarEmail');
    const fotoArquivoInput = document.getElementById('editarFotoArquivo');
    const previewFoto = document.getElementById('previewFoto');

    // Preenche os campos com os dados atuais
    nomeInput.value = usuario.nome || '';
    emailSpan.textContent = usuario.email || '';

    // Guarda a foto em base64
    let fotoBase64 = usuario.foto_url || '';

    // Função para atualizar a pré-visualização da foto
    function atualizarPreview(url) {
        if (url) {
            previewFoto.innerHTML = `<img src="${url}" alt="Foto do perfil" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            previewFoto.classList.add('tem-foto');
        } else {
            previewFoto.innerHTML = '👨‍🚀';
            previewFoto.classList.remove('tem-foto');
        }
    }

    // Se o usuário já tem foto, mostra
    if (usuario.foto_url) {
        atualizarPreview(usuario.foto_url);
    }

    // Pré-visualiza ao escolher um arquivo
    fotoArquivoInput.addEventListener('change', () => {
        const arquivo = fotoArquivoInput.files[0];

        if (!arquivo) {
            fotoBase64 = '';
            return;
        }

        // Valida se é imagem
        if (!arquivo.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem.');
            fotoArquivoInput.value = '';
            return;
        }

        // Converte o arquivo para base64 (para salvar no banco como texto)
        const leitor = new FileReader();

        leitor.onload = (e) => {
            fotoBase64 = e.target.result;
            atualizarPreview(fotoBase64);
        };

        leitor.readAsDataURL(arquivo);
    });

    // Evento de salvar
    const form = document.getElementById('formEditarPerfil');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const novoNome = nomeInput.value.trim();

        if (!novoNome) {
            alert('Por favor, preencha o nome.');
            return;
        }

        if (!fotoBase64) {
            alert('Por favor, escolha uma foto de perfil (arquivo).');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/usuario/${usuario.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: novoNome,
                    foto_url: fotoBase64
                })
            });

            const resultado = await response.json();

            if (response.ok) {
                // Atualiza os dados salvos no localStorage
                usuario.nome = novoNome;
                usuario.foto_url = fotoBase64;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

                alert(resultado.mensagem || 'Perfil atualizado com sucesso!');
                window.location.href = './perfil.html';
            } else {
                alert(resultado.mensagem || 'Erro ao atualizar o perfil.');
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Não foi possível conectar ao servidor. Verifique se ele está rodando em http://localhost:3000');
        }
    });

});
