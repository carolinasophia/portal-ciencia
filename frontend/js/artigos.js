document.addEventListener("DOMContentLoaded", () => {
    // Renderiza os artigos do banco dentro da mesma grade dos artigos prontos
    const grid = document.querySelector(".article-grid");

    // Faz a requisição para a nossa API Node.js
    fetch("http://localhost:3000/api/artigos")
        .then(response => response.json())
        .then(artigos => {
            if (!grid) {
                console.warn("Grade de artigos não encontrada.");
                return;
            }

            // Passa por cada artigo vindo do banco de dados e cria o card dinâmico
            artigos.forEach(artigo => {
const card = document.createElement("article");
                card.classList.add("article-card", "card");
                card.setAttribute("data-titulo", artigo.titulo || "");
                card.onclick = () => {
                    window.location.href = `artigo-dinamico.html?id=${artigo.id_artigo}`;
                };

                const imagem = artigo.imagem_url
                    ? `<img src="${escapaHTML(artigo.imagem_url)}" alt="${escapaHTML(artigo.titulo)}" loading="lazy">`
                    : '<div style="height:200px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:3rem;">🔬</div>';

                card.innerHTML = `
                    <div class="article-image">
                        ${imagem}
                    </div>
                    <div class="article-content">
                        <h3>${escapaHTML(artigo.titulo)}</h3>
                        <p>${escapaHTML(resumir(artigo.conteudo, 120))}</p>
                        <span class="article-date">✍️ ${escapaHTML(artigo.autor_nome || 'Anônimo')} • 📅 ${formatarData(artigo.data_publicacao)}</span>
                    </div>
                `;

                grid.appendChild(card);
            });

            // Reaplica a busca para incluir os novos cards
            if (typeof barraBusca !== 'undefined' && barraBusca) {
                barraBusca.dispatchEvent(new Event('input'));
            }
        })
        .catch(error => console.error("Erro ao carregar artigos:", error));
});

// =========================
// FUNÇÕES AUXILIARES
// =========================
function escapaHTML(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function resumir(texto, max) {
    if (!texto) return '';
    texto = texto.replace(/\s+/g, ' ').trim();
    if (texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
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
