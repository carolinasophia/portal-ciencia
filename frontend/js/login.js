// Captura os elementos do HTML através dos IDs que adicionamos
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnEntrar = document.getElementById('btnEntrar');

// Evento de clique no botão "Entrar"
btnEntrar.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validação básica para evitar campos vazios
    if (email === '' || password === '') {
        alert('Por favor, preencha todos os campos!');
        return; 
    }

    // Objeto com os dados que o backend vai receber
    const dadosLogin = {
        email: email,
        password: password
    };

    try {
        // Envia os dados para a API do seu TCC
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosLogin)
        });

        const resultado = await response.json();

        if (response.ok) {
            alert('Login realizado com sucesso!');
            
            // 1. SALVA OS DADOS DO USUÁRIO (Importante para a Home e Perfil funcionarem!)
            // Caso seu backend retorne o usuário dentro de 'resultado.user', usamos ele.
            // Se não, criamos um objeto padrão usando o e-mail digitado.
            const dadosUsuario = resultado.user || { nome: email.split('@')[0], email: email };
            localStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));

            // Salva o token se o seu sistema utilizar JWT
            if (resultado.token) {
                localStorage.setItem('token', resultado.token);
            }
            
// 2. REDIRECIONA PARA A HOME (index.html)
            window.location.href = './index.html';
        } else {
            // Mensagem de erro retornada pelo servidor (Ex: "Senha incorreta")
            alert(resultado.message || 'Erro ao fazer login.');
        }

    } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Não foi possível conectar ao servidor.');
    }
});

// Permite que o usuário aperte "Enter" no campo de senha para logar
passwordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        btnEntrar.click();
    }
});