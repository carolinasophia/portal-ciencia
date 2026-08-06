// js/artigo-dinamico.js
document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://localhost:3000/api/artigos';

    // Obtém o id do artigo da URL (?id=X)
    const params = new URLSearchParams(window.location.search);
    const idArtigo = params.get('id');

    const usuarioLogado = localStorage.getItem('usuarioLogado');
    let usuario = null;

    if (usuarioLogado) {
        try {
            usuario = JSON.parse(usuarioLogado);
        } catch (e) {
            usuario = null;
        }
    }

    // ==========================================
    // CARREGAR ARTIGO
    // ==========================================
    async function carregarArtigo() {
        const container = document.getElementById('artigoConteudo');

        if (!idArtigo) {
            container.innerHTML = '<p class="carregando">Artigo não encontrado.</p>';
            return;
        }

        try {
            const response = await fetch(`${API}/${idArtigo}`);

            if (!response.ok) {
                throw new Error('Artigo não encontrado.');
            }

            const artigo = await response.json();

            document.title = `${artigo.titulo} - Portal Ciência`;

            container.innerHTML = `
                <h1>${escapaHTML(artigo.titulo)}</h1>

                <div class="artigo-meta">
                    <span>✍️ ${escapaHTML(artigo.autor_nome || 'Anônimo')}</span>
                    <span>📅 ${formatarData(artigo.data_publicacao)}</span>
                </div>

                ${artigo.imagem_url
                    ? `<img src="${escapaHTML(artigo.imagem_url)}" alt="${escapaHTML(artigo.titulo)}">`
                    : ''
                }

                <p>${escapaHTML(artigo.conteudo)}</p>
            `;

            // Mostra a seção de comentários
            document.getElementById('secaoComentarios').style.display = 'block';

            // Carrega os comentários
            carregarComentarios();
            configurarFormComentario();

        } catch (error) {
            console.error('Erro ao carregar artigo:', error);
            container.innerHTML = '<p class="carregando">Não foi possível carregar o artigo. Verifique se o servidor está rodando.</p>';
        }
    }

    // ==========================================
    // CARREGAR COMENTÁRIOS
    // ==========================================
    async function carregarComentarios() {
        const lista = document.getElementById('listaComentarios');

        try {
            const response = await fetch(`${API}/${idArtigo}/comentarios`);

            if (!response.ok) {
                throw new Error('Erro ao buscar comentários.');
            }

            const comentarios = await response.json();

            if (comentarios.length === 0) {
                lista.innerHTML = '<p class="sem-comentarios">Nenhum comentário ainda. Seja o primeiro a comentar! 💬</p>';
                return;
            }

            lista.innerHTML = '';

            comentarios.forEach(comentario => {
                const div = document.createElement('div');
                div.className = 'comentario';

                div.innerHTML = `
                    <div class="comentario-autor">👤 ${escapaHTML(comentario.autor_nome || 'Usuário')}</div>
                    <div class="comentario-texto">${escapaHTML(comentario.texto)}</div>
                    <div class="comentario-data">🕐 ${formatarData(comentario.data_envio)}</div>
                `;

                lista.appendChild(div);
            });

        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            lista.innerHTML = '<p class="sem-comentarios">Não foi possível carregar os comentários.</p>';
        }
    }

    // ==========================================
    // CONFIGURAR FORMULÁRIO DE COMENTÁRIO
    // ==========================================
    function configurarFormComentario() {
        const formContainer = document.getElementById('formComentario');

        // Se não estiver logado, mostra aviso para fazer login
        if (!usuario) {
            formContainer.innerHTML = `
                <div class="aviso-login">
                    Faça <a href="login.html">login</a> para comentar.
                </div>
            `;
            return;
        }

        formContainer.innerHTML = `
            <form id="formNovoComentario">
                <p><strong>Comentar como ${escapaHTML(usuario.nome)}</strong></p>
                <textarea id="textoComentario" placeholder="Escreva seu comentário..." required></textarea>
                <button type="submit" class="btn-comentar">💬 Comentar</button>
            </form>
        `;

        const form = document.getElementById('formNovoComentario');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const texto = document.getElementById('textoComentario').value.trim();

            if (!texto) {
                alert('Escreva um comentário antes de enviar.');
                return;
            }

            try {
                const response = await fetch(`${API}/${idArtigo}/comentarios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        texto: texto,
                        id_usuario: usuario.id
                    })
                });

                const resultado = await response.json();

                if (response.ok) {
                    alert(resultado.mensagem || 'Comentário adicionado!');
                    form.reset();
                    carregarComentarios();
                } else {
                    alert(resultado.mensagem || 'Erro ao adicionar comentário.');
                }

            } catch (error) {
                console.error('Erro de conexão:', error);
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================
    function escapaHTML(texto) {
        if (texto === null || texto === undefined) return '';
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
        }) + ' ' + d.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Inicializa
    carregarArtigo();

});
