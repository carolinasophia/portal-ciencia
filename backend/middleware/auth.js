const jwt = require('jsonwebtoken');

function autenticarToken(req, res, next) {

    const authHeader = req.headers['authorization'];

    // Verifica se o Authorization foi enviado
    if (!authHeader) {
        return res.status(401).json({
            mensagem: 'Token de acesso não informado.'
        });
    }

    // Esperamos:
    // Authorization: Bearer TOKEN
    const partes = authHeader.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({
            mensagem: 'Formato de token inválido.'
        });
    }

    const token = partes[1];

    try {

        // Verifica se o token é válido
        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guarda os dados do usuário na requisição
        req.usuario = usuario;

        // Continua para a rota
        next();

    } catch (erro) {

        return res.status(401).json({
            mensagem: 'Token inválido ou expirado.'
        });
    }
}

module.exports = autenticarToken;