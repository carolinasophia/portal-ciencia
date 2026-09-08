// =========================
// ELEMENTOS DO HTML
// =========================

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnEntrar = document.getElementById('btnEntrar');


// =========================
// FUNÇÃO DE LOGIN
// =========================

async function realizarLogin() {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validação dos campos
    if (email === '' || password === '') {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    // Dados enviados para o servidor
    const dadosLogin = {
        email: email,
        password: password
    };

    // Desabilita o botão durante o login
    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando...';

    try {

        const response = await fetch(
            'http://localhost:3000/api/login',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(dadosLogin)
            }
        );

        const resultado = await response.json();
        console.log('RESPOSTA DO SERVIDOR:', resultado);

        // =========================
        // LOGIN BEM-SUCEDIDO
        // =========================

        if (response.ok) {

            // Verifica se o servidor realmente enviou o token
            if (!resultado.token) {

                console.error('Token JWT não recebido.');

                alert(
                    'O login foi realizado, mas o servidor não enviou o token de autenticação.'
                );

                return;
            }

            // Salva o JWT
            localStorage.setItem(
                'token',
                resultado.token
            );

            // Salva os dados do usuário
            localStorage.setItem(
                'usuarioLogado',
                JSON.stringify(resultado.user)
            );

            alert('Login realizado com sucesso!');

            // Redireciona para a página inicial
            window.location.href = './index.html';

        } else {

            // =========================
            // ERRO NO LOGIN
            // =========================

            alert(
                resultado.message ||
                resultado.mensagem ||
                'E-mail ou senha incorretos.'
            );
        }

    } catch (error) {

        console.error(
            'Erro de conexão com o servidor:',
            error
        );

        alert(
            'Não foi possível conectar ao servidor.'
        );

    } finally {

        // Reativa o botão
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
    }
}


// =========================
// BOTÃO ENTRAR
// =========================

btnEntrar.addEventListener(
    'click',
    realizarLogin
);


// =========================
// TECLA ENTER
// =========================

passwordInput.addEventListener(
    'keypress',
    (event) => {

        if (event.key === 'Enter') {
            realizarLogin();
        }

    }
);