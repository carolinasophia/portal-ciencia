const barraBusca = document.getElementById("barraBusca");
const cards = document.querySelectorAll(".card");

barraBusca.addEventListener("input", () => {

    const pesquisa = barraBusca.value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    cards.forEach(card => {

        const titulo = card.dataset.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (titulo.includes(pesquisa)) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

});