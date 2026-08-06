document
.getElementById("cadastroForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    try {

        const resposta = await fetch(
            "http://localhost:3000/cadastro",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome,
                    email,
                    senha
                })
            }
        );

        const texto = await resposta.text();

        console.log("Resposta do servidor:");
        console.log(texto);

        if (!resposta.ok) {
            alert("Erro do servidor:\n" + texto);
            return;
        }

        const dados = JSON.parse(texto);

        alert(dados.mensagem);

    } catch (erro) {

        console.error("ERRO:", erro);

        alert("Erro ao conectar com o servidor.");

    }

});