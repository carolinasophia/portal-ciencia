const barraBusca = document.getElementById("barraBusca");
const cards = document.querySelectorAll(".card");
const mensagemErro = document.getElementById("mensagemErro");

barraBusca.addEventListener("input", () => {

    const valor = barraBusca.value.toLowerCase();

    const pesquisa = barraBusca.value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    let encontrou = false;

    cards.forEach(card => {

        const tituloSimples = card.dataset.titulo.toLowerCase();

        const titulo = card.dataset.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (titulo.includes(pesquisa) || tituloSimples.includes(valor)) {

            card.style.display = "";
            encontrou = true;

        } else {

            card.style.display = "none";

        }

    });

    if (encontrou) {

        mensagemErro.style.display = "none";

    } else {

        mensagemErro.style.display = "block";

    }

});