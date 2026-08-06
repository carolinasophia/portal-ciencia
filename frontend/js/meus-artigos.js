// js/meus-artigos.js
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

    if (!usuario.id) {
        alert("Usuário inválido. Por favor, faça login novamente.");
        window.location.href = "./login.html";
        return;
    }

const API = 'http://localhost:3000/api/artigos';

// ==========================================
    // ESTADO DE EDIÇÃO
    // ==========================================
    let editandoId = null; // null = modo publicar, id = modo editar

    // ==========================================
    // PREVIEW DA IMAGEM DO ARTIGO (por arquivo)
    // ==========================================
    let imagemBase64 = '';

    window.previewImagemArtigo = function (evento) {
        const arquivo = evento.target.files[0];
        const preview = document.getElementById('previewImagemArtigo');

        if (!arquivo) {
            imagemBase64 = '';
            preview.style.display = 'none';
            return;
        }

        // Valida se é imagem
        if (!arquivo.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem.');
            evento.target.value = '';
            imagemBase64 = '';
            preview.style.display = 'none';
            return;
        }

        // Converte o arquivo para base64
        const leitor = new FileReader();

        leitor.onload = (e) => {
            imagemBase64 = e.target.result;
            preview.querySelector('img').src = imagemBase64;
            preview.style.display = 'block';
        };

        leitor.readAsDataURL(arquivo);
    };

    // ==========================================
    // CARREGAR ARTIGOS DO USUÁRIO
    // ==========================================
    async function carregarArtigos() {

        const lista = document.getElementById('listaArtigos');

        try {
            const response = await fetch(`${API}/usuario/${usuario.id}`);

            if (!response.ok) {
                throw new Error('Erro ao buscar artigos.');
            }

            const artigos = await response.json();

            // Se não tiver artigos
            if (artigos.length === 0) {
                lista.innerHTML = `
                    <p class="sem-artigos">
                        Você ainda não publicou nada. Comece agora! 🚀
                    </p>
                `;
                return;
            }

            // Monta os cards
            lista.innerHTML = '';

            artigos.forEach(artigo => {

                const card = document.createElement('div');
                card.className = 'meu-artigo';

card.innerHTML = `
                    <div class="meu-artigo-info">
                        <h3>${escapaHTML(artigo.titulo)}</h3>
                        <p>${escapaHTML(artigo.conteudo)}</p>
                        ${artigo.imagem_url ? `<img src="${escapaHTML(artigo.imagem_url)}" alt="Imagem do artigo">` : ''}
                        <span class="meu-artigo-data">
                            📅 ${formatarData(artigo.data_publicacao)}
                        </span>
                    </div>
                    <div class="meu-artigo-acoes">
                        <button class="btnEditar" data-id="${artigo.id_artigo}">
                            ✏️ Editar
                        </button>
                        <button class="btnExcluir" data-id="${artigo.id_artigo}">
                            🗑️ Excluir
                        </button>
                    </div>
                `;

                lista.appendChild(card);
            });

            // Configura os botões de editar
            document.querySelectorAll('.btnEditar').forEach(btn => {
                btn.addEventListener('click', () => editarArtigo(btn.dataset.id));
            });

            // Configura os botões de excluir
            document.querySelectorAll('.btnExcluir').forEach(btn => {
                btn.addEventListener('click', () => excluirArtigo(btn.dataset.id, btn));
            });

        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
            lista.innerHTML = `
                <p class="sem-artigos">
                    Não foi possível carregar seus artigos. Verifique se o servidor está rodando.
                </p>
            `;
        }
    }

// ==========================================
    // EDITAR ARTIGO (preenche o formulário)
    // ==========================================
    async function editarArtigo(id) {
        try {
            const response = await fetch(`${API}/${id}`);

            if (!response.ok) {
                throw new Error('Artigo não encontrado.');
            }

            const artigo = await response.json();

            // Preenche o formulário
            document.getElementById('artigoTitulo').value = artigo.titulo || '';
            document.getElementById('artigoConteudo').value = artigo.conteudo || '';

            // Mostra a imagem atual no preview
            imagemBase64 = artigo.imagem_url || '';
            const preview = document.getElementById('previewImagemArtigo');
            if (imagemBase64) {
                preview.querySelector('img').src = imagemBase64;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }

            // Ativa o modo edição
            editandoId = id;

            const botao = document.getElementById('btnPublicar');
            botao.textContent = '💾 Salvar Alterações';

            const tituloCard = document.querySelector('.artigo-card-form h2');
            if (tituloCard) tituloCard.textContent = '✏️ Editando Artigo';

            // Adiciona botão de cancelar se ainda não existir
            if (!document.getElementById('btnCancelarEdicao')) {
                const btnCancelar = document.createElement('button');
                btnCancelar.id = 'btnCancelarEdicao';
                btnCancelar.type = 'button';
                btnCancelar.textContent = '✖ Cancelar Edição';
                btnCancelar.addEventListener('click', resetarFormulario);
                btnPublicar.parentNode.insertBefore(btnCancelar, btnPublicar.nextSibling);
            }

            // Rola até o formulário
            document.querySelector('.artigo-card-form').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao carregar artigo para edição:', error);
            alert('Não foi possível carregar o artigo para edição.');
        }
    }

    // ==========================================
    // RESETAR FORMULÁRIO (volta ao modo publicar)
    // ==========================================
    function resetarFormulario() {
        const form = document.getElementById('formPublicar');
        form.reset();

        editandoId = null;
        imagemBase64 = '';

        const preview = document.getElementById('previewImagemArtigo');
        preview.style.display = 'none';

        const botao = document.getElementById('btnPublicar');
        botao.textContent = '📤 Publicar';

        const tituloCard = document.querySelector('.artigo-card-form h2');
        if (tituloCard) tituloCard.textContent = '✍️ Publicar Novo Conteúdo';

        const btnCancelar = document.getElementById('btnCancelarEdicao');
        if (btnCancelar) btnCancelar.remove();

        // Rola até o topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const btnPublicar = document.getElementById('btnPublicar');

    // ==========================================
    // PUBLICAR / ATUALIZAR ARTIGO
    // ==========================================
    const form = document.getElementById('formPublicar');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titulo = document.getElementById('artigoTitulo').value.trim();
        const conteudo = document.getElementById('artigoConteudo').value.trim();
        const imagem_url = imagemBase64 || null;

        if (!titulo || !conteudo) {
            alert('Preencha o título e o conteúdo.');
            return;
        }

        if (editandoId) {
            // ===== MODO EDIÇÃO =====
            const confirmar = confirm('Deseja salvar as alterações?');
            if (!confirmar) return;

            try {
                const response = await fetch(`${API}/${editandoId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        titulo: titulo,
                        conteudo: conteudo,
                        imagem_url: imagem_url
                    })
                });

                const resultado = await response.json();

                if (response.ok) {
                    alert(resultado.mensagem || 'Artigo atualizado com sucesso!');
                    resetarFormulario();
                    carregarArtigos();
                } else {
                    alert(resultado.mensagem || 'Erro ao atualizar o artigo.');
                }

            } catch (error) {
                console.error('Erro de conexão:', error);
                alert('Não foi possível conectar ao servidor. Verifique se ele está rodando.');
            }
            return;
        }

        // ===== MODO PUBLICAR =====
        // Confirmação antes de publicar
        const confirmar = confirm('Deseja publicar este conteúdo?');
        if (!confirmar) return;

        try {
            const response = await fetch(API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo: titulo,
                    conteudo: conteudo,
                    imagem_url: imagem_url || null,
                    id_autor: usuario.id
                })
            });

            const resultado = await response.json();

            if (response.ok) {
                alert(resultado.mensagem || 'Artigo publicado com sucesso!');
                form.reset();
                carregarArtigos(); // Atualiza a lista
            } else {
                alert(resultado.mensagem || 'Erro ao publicar o artigo.');
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Não foi possível conectar ao servidor. Verifique se ele está rodando.');
        }
    });

    // ==========================================
    // EXCLUIR ARTIGO
    // ==========================================
    async function excluirArtigo(id, btn) {

        const confirmar = confirm('Tem certeza que deseja excluir esta publicação?');
        if (!confirmar) return;

        try {
            const response = await fetch(`${API}/${id}`, {
                method: 'DELETE'
            });

            const resultado = await response.json();

            if (response.ok) {
                alert(resultado.mensagem || 'Artigo excluído com sucesso!');
                carregarArtigos(); // Atualiza a lista
            } else {
                alert(resultado.mensagem || 'Erro ao excluir o artigo.');
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================
    function escapaHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    function formatarData(data) {
        if (!data) return '—';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Inicializa carregando os artigos
    carregarArtigos();

});
