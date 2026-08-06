// js/minhas-publicacoes.js
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
    // CONFIGURA O CANAL (cabeçalho)
    // ==========================================
    function configurarCanal() {
        const avatar = document.getElementById('canalAvatar');
        const nome = document.getElementById('canalNome');

        if (usuario.nome) nome.textContent = usuario.nome;

        if (usuario.foto_url) {
            avatar.innerHTML = `<img src="${usuario.foto_url}" alt="Foto de ${usuario.nome}">`;
        } else {
            avatar.textContent = (usuario.nome || "U").charAt(0).toUpperCase();
        }
    }

    // ==========================================
    // CARREGAR PUBLICAÇÕES
    // ==========================================
    async function carregarPublicacoes() {

        const grade = document.getElementById('gradePublicacoes');
        const contador = document.getElementById('canalContador');

        try {
            const response = await fetch(`${API}/usuario/${usuario.id}`);

            if (!response.ok) {
                throw new Error('Erro ao buscar publicações.');
            }

            const artigos = await response.json();

            contador.textContent = `${artigos.length} ${artigos.length === 1 ? 'publicação' : 'publicações'}`;

            // Se não tiver publicações
            if (artigos.length === 0) {
                grade.innerHTML = `
                    <div class="sem-publicacoes">
                        <div class="icone-vazio">🎬</div>
                        <h3>Nenhuma publicação ainda</h3>
                        <p>Quando você publicar um conteúdo, ele aparecerá aqui como um vídeo no YouTube.</p>
                        <a href="meus-artigos.html" class="btnPublicarNovo">➕ Publicar Agora</a>
                    </div>
                `;
                return;
            }

            // Monta os cards estilo YouTube
            grade.innerHTML = '';

            artigos.forEach(artigo => {

                const card = document.createElement('div');
                card.className = 'pub-card';

                card.innerHTML = `
                    <div class="pub-thumb" data-id="${artigo.id_artigo}">
                        ${artigo.imagem_url
                            ? `<img src="${escapaHTML(artigo.imagem_url)}" alt="${escapaHTML(artigo.titulo)}">`
                            : `<div class="thumb-placeholder">🚀</div>`
                        }
                        <div class="thumb-duracao">Publicado</div>
                    </div>

                    <div class="pub-info">

                        <div class="pub-avatar-mini" data-info="1">
                            ${usuario.foto_url
                                ? `<img src="${usuario.foto_url}" alt="${escapaHTML(usuario.nome)}">`
                                : (usuario.nome || "U").charAt(0).toUpperCase()
                            }
                        </div>

                        <div class="pub-detalhes">
                            <h3 class="pub-titulo" data-id="${artigo.id_artigo}">${escapaHTML(artigo.titulo)}</h3>
                            <span class="pub-autor">${escapaHTML(usuario.nome)}</span>
                            <span class="pub-data">${formatarData(artigo.data_publicacao)}</span>
                        </div>

                    </div>

                    <div class="pub-acoes">
                        <button class="btnAbrir" data-id="${artigo.id_artigo}">▶ Assistir</button>
                        <button class="btnApagar" data-id="${artigo.id_artigo}">🗑️ Excluir</button>
                    </div>
                `;

                grade.appendChild(card);
            });

            // Eventos dos cards
            document.querySelectorAll('.pub-thumb').forEach(el => {
                el.addEventListener('click', () => abrirPublicacao(el.dataset.id));
            });

            document.querySelectorAll('.pub-titulo').forEach(el => {
                el.addEventListener('click', () => abrirPublicacao(el.dataset.id));
            });

            document.querySelectorAll('.btnAbrir').forEach(btn => {
                btn.addEventListener('click', () => abrirPublicacao(btn.dataset.id));
            });

            document.querySelectorAll('.btnApagar').forEach(btn => {
                btn.addEventListener('click', () => excluirPublicacao(btn.dataset.id));
            });

        } catch (error) {
            console.error('Erro ao carregar publicações:', error);
            grade.innerHTML = `
                <p class="sem-publicacoes">
                    Não foi possível carregar suas publicações. Verifique se o servidor está rodando.
                </p>
            `;
        }
    }

    // ==========================================
    // ABRIR PUBLICAÇÃO (modal estilo player)
    // ==========================================
async function abrirPublicacao(id) {

        try {
            const response = await fetch(`${API}/${id}`);

            if (!response.ok) {
                throw new Error('Publicação não encontrada.');
            }

            const artigo = await response.json();

            const modal = document.getElementById('modalVerPublicacao');
            const corpo = document.getElementById('modalCorpo');

            corpo.innerHTML = `
                ${artigo.imagem_url
                    ? `<img class="modal-imagem" src="${escapaHTML(artigo.imagem_url)}" alt="${escapaHTML(artigo.titulo)}">`
                    : `<div class="modal-sem-imagem">🚀</div>`
                }

                <h2 class="modal-titulo">${escapaHTML(artigo.titulo)}</h2>

                <div class="modal-meta">
                    <span class="modal-autor">${escapaHTML(artigo.autor_nome || usuario.nome)}</span>
                    <span class="modal-data">${formatarData(artigo.data_publicacao)}</span>
                </div>

<p class="modal-conteudo">${escapaHTML(artigo.conteudo)}</p>

                <a href="artigo-dinamico.html?id=${artigo.id_artigo}" class="modal-ver-publicacao" target="_blank">
                    🔗 Ver publicação na página
                </a>
            `;

            modal.style.display = 'flex';

        } catch (error) {
            console.error('Erro ao abrir publicação:', error);
            alert('Não foi possível abrir a publicação.');
        }
    }

    // ==========================================
    // EXCLUIR PUBLICAÇÃO
    // ==========================================
    async function excluirPublicacao(id) {

        const confirmar = confirm('Tem certeza que deseja excluir esta publicação?');
        if (!confirmar) return;

        try {
            const response = await fetch(`${API}/${id}`, {
                method: 'DELETE'
            });

            const resultado = await response.json();

            if (response.ok) {
                alert(resultado.mensagem || 'Publicação excluída com sucesso!');
                carregarPublicacoes();
            } else {
                alert(resultado.mensagem || 'Erro ao excluir a publicação.');
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    }

    // ==========================================
    // FECHAR MODAL (global)
    // ==========================================
    window.fecharModal = function () {
        document.getElementById('modalVerPublicacao').style.display = 'none';
    };

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

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    configurarCanal();
    carregarPublicacoes();

});
