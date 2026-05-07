const barraBusca = document.getElementById("barraBusca");
const cards = document.querySelectorAll(".card");

barraBusca.addEventListener("input", () => {
  const pesquisa = barraBusca.value.toLowerCase();

  cards.forEach(card => {
    const titulo = card.dataset.titulo.toLowerCase();

    if (titulo.includes(pesquisa)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
});