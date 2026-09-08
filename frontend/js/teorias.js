// ========================================
// PORTAL CIÊNCIA - TEORIAS
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("teoriasContainer");
    const campoPesquisa = document.getElementById("campoPesquisa");
    const filtroCategoria = document.getElementById("filtroCategoria");
    const contadorTeorias = document.getElementById("contadorTeorias");

    let teorias = [];

    // ========================================
    // ESCAPAR HTML
    // ========================================

    function escaparHTML(texto) {

        if (texto === null || texto === undefined) {
            return "";
        }

        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ========================================
    // MOSTRAR CONTADOR
    // ========================================

    function atualizarContador(quantidade) {

        if (!contadorTeorias) {
            return;
        }

        if (quantidade === 1) {
            contadorTeorias.textContent = "1 teoria encontrada";
        } else {
            contadorTeorias.textContent = `${quantidade} teorias encontradas`;
        }
    }

    // ========================================
    // CARREGAR TEORIAS
    // ========================================

    async function carregarTeorias() {

        if (!container) {
            console.error("Elemento #teoriasContainer não encontrado.");
            return;
        }

        try {

            container.innerHTML = `
                <div class="estado-carregando">
                    <div class="spinner"></div>
                    <p>Carregando teorias científicas...</p>
                </div>
            `;

            /*
             * IMPORTANTE:
             * O Live Server está rodando na porta 5500
             * e o seu Node/Express está na porta 3000.
             *
             * Por isso usamos a URL completa da API.
             */

            const resposta = await fetch(
                "http://localhost:3000/api/teorias"
            );

            if (!resposta.ok) {
                throw new Error(
                    `Erro HTTP ${resposta.status}`
                );
            }

            const dados = await resposta.json();

            if (!Array.isArray(dados)) {
                throw new Error(
                    "A API não retornou uma lista de teorias."
                );
            }

            teorias = dados;

            console.log("Teorias recebidas:", teorias);

            atualizarContador(teorias.length);

            mostrarTeorias(teorias);

        } catch (erro) {

            console.error(
                "Erro ao carregar teorias:",
                erro
            );

            atualizarContador(0);

            container.innerHTML = `
                <div class="estado-erro">

                    <div class="icone-erro">
                        ⚠️
                    </div>

                    <h3>
                        Não foi possível carregar as teorias
                    </h3>

                    <p>
                        Verifique se o servidor Node está funcionando
                        na porta 3000 e tente novamente.
                    </p>

                    <button
                        class="btn-tentar"
                        type="button"
                        onclick="location.reload()"
                    >
                        Tentar novamente
                    </button>

                </div>
            `;
        }
    }

    // ========================================
    // MOSTRAR TEORIAS
    // ========================================

    function mostrarTeorias(lista) {

        if (!container) {
            return;
        }

        if (!Array.isArray(lista) || lista.length === 0) {

            atualizarContador(0);

            container.innerHTML = `
                <div class="estado-erro">

                    <div class="icone-erro">
                        🔭
                    </div>

                    <h3>
                        Nenhuma teoria encontrada
                    </h3>

                    <p>
                        Tente pesquisar por outro termo
                        ou selecionar outra área.
                    </p>

                </div>
            `;

            return;
        }

        atualizarContador(lista.length);

        container.innerHTML = lista.map((teoria) => {

            const id = teoria.id_teoria;

            const titulo =
                teoria.titulo || "Teoria sem título";

            const resumo =
                teoria.resumo || "Nenhum resumo disponível.";

            const area =
                teoria.area || "Ciência";

            const autor =
                teoria.autor_nome || "Portal Ciência";

            return `
                <article class="teoria-card">

                    <div class="card-topo">

                        <span class="teoria-area">
                            ${escaparHTML(area)}
                        </span>

                        <span class="icone-teoria">
                            ✦
                        </span>

                    </div>

                    <h2>
                        ${escaparHTML(titulo)}
                    </h2>

                    <p class="teoria-resumo">
                        ${escaparHTML(resumo)}
                    </p>

                    <div class="teoria-info">

                        <span>
                            👤 ${escaparHTML(autor)}
                        </span>

                    </div>

                    <a
                        href="teoria.html?id=${encodeURIComponent(id)}"
                        class="btn-ver"
                    >
                        Explorar teoria
                        <span>→</span>
                    </a>

                </article>
            `;

        }).join("");
    }

    // ========================================
    // FILTRAR TEORIAS
    // ========================================

    function filtrarTeorias() {

        const pesquisa = campoPesquisa
            ? campoPesquisa.value
                .toLocaleLowerCase("pt-BR")
                .trim()
            : "";

        const categoria = filtroCategoria
            ? filtroCategoria.value
                .toLocaleLowerCase("pt-BR")
                .trim()
            : "";

        const resultado = teorias.filter((teoria) => {

            const titulo =
                String(teoria.titulo || "")
                    .toLocaleLowerCase("pt-BR");

            const resumo =
                String(teoria.resumo || "")
                    .toLocaleLowerCase("pt-BR");

            const conteudo =
                String(teoria.conteudo || "")
                    .toLocaleLowerCase("pt-BR");

            const area =
                String(teoria.area || "")
                    .toLocaleLowerCase("pt-BR");

            const autor =
                String(teoria.autor_nome || "")
                    .toLocaleLowerCase("pt-BR");

            const correspondePesquisa =
                titulo.includes(pesquisa) ||
                resumo.includes(pesquisa) ||
                conteudo.includes(pesquisa) ||
                area.includes(pesquisa) ||
                autor.includes(pesquisa);

            const correspondeCategoria =
                categoria === "" ||
                area === categoria;

            return (
                correspondePesquisa &&
                correspondeCategoria
            );
        });

        mostrarTeorias(resultado);
    }

    // ========================================
    // EVENTO DA PESQUISA
    // ========================================

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            filtrarTeorias
        );
    }

    // ========================================
    // EVENTO DO FILTRO
    // ========================================

    if (filtroCategoria) {

        filtroCategoria.addEventListener(
            "change",
            filtrarTeorias
        );
    }

    // ========================================
    // INICIAR
    // ========================================

    carregarTeorias();

});