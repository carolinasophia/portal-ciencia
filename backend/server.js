const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'portal_ciencia'
});

// Teste de conexão
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }

    console.log('Conectado ao Banco de Dados MySQL com sucesso!');
});

// =========================
// TESTE DA API
// =========================
app.get('/', (req, res) => {
    res.send('API Portal Ciência funcionando!');
});

// =========================
// LISTAR ARTIGOS
// =========================
app.get('/api/artigos', (req, res) => {

    const sql = `
        SELECT
            a.*,
            u.nome AS autor_nome
        FROM Artigos a
        LEFT JOIN Usuarios u
            ON a.id_autor = u.id_usuario
        ORDER BY a.data_publicacao DESC
    `;

    db.query(sql, (erro, resultados) => {

        if (erro) {
            console.error('Erro ao buscar artigos:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        res.json(resultados);
    });
});

// =========================
// CADASTRAR USUÁRIO
// =========================
app.post('/cadastro', (req, res) => {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: 'Todos os campos são obrigatórios.'
        });
    }

    const sql = `
        INSERT INTO Usuarios (nome, email, senha)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [nome, email, senha], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            id: resultado.insertId
        });
    });
});

// =========================
// LOGIN
// =========================
app.post('/api/login', (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Preencha todos os campos.'
        });
    }

    const sql = `
        SELECT *
        FROM Usuarios
        WHERE email = ?
        LIMIT 1
    `;

    db.query(sql, [email], (erro, resultados) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                message: 'Erro no servidor.'
            });
        }

        if (resultados.length === 0) {
            return res.status(401).json({
                message: 'Usuário não encontrado.'
            });
        }

        const usuario = resultados[0];

        if (usuario.senha !== password) {
            return res.status(401).json({
                message: 'Senha incorreta.'
            });
        }

res.json({
            message: 'Login realizado com sucesso!',
            user: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                foto_url: usuario.foto_url
            }
        });

    });

});

// =========================
// ATUALIZAR USUÁRIO (NOME + FOTO)
// =========================
app.put('/api/usuario/:id', (req, res) => {

    const { id } = req.params;
    const { nome, foto_url } = req.body;

    if (!nome) {
        return res.status(400).json({
            mensagem: 'O campo nome é obrigatório.'
        });
    }

    const sql = `
        UPDATE Usuarios
        SET nome = ?, foto_url = ?
        WHERE id_usuario = ?
    `;

    db.query(sql, [nome, foto_url || null, id], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        // Busca os dados atualizados para retornar
        const sqlBusca = `
            SELECT id_usuario, nome, email, foto_url
            FROM Usuarios
            WHERE id_usuario = ?
        `;

        db.query(sqlBusca, [id], (erro2, resultados) => {

            if (erro2) {
                console.error('ERRO MYSQL:', erro2);

                return res.status(500).json({
                    mensagem: erro2.message
                });
            }

            res.json({
                mensagem: 'Perfil atualizado com sucesso!',
                user: resultados[0]
            });

        });

    });

});

// =========================
// ALTERAR SENHA
// =========================
app.put('/api/usuario/:id/senha', (req, res) => {

    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
            mensagem: 'Preencha a senha atual e a nova senha.'
        });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({
            mensagem: 'A nova senha deve ter pelo menos 6 caracteres.'
        });
    }

    // Busca a senha atual do usuário no banco
    const sqlBusca = `
        SELECT senha
        FROM Usuarios
        WHERE id_usuario = ?
        LIMIT 1
    `;

    db.query(sqlBusca, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        const usuario = resultados[0];

        // Verifica se a senha atual está correta
        if (usuario.senha !== senhaAtual) {
            return res.status(401).json({
                mensagem: 'Senha atual incorreta.'
            });
        }

        // Atualiza a senha
        const sqlUpdate = `
            UPDATE Usuarios
            SET senha = ?
            WHERE id_usuario = ?
        `;

        db.query(sqlUpdate, [novaSenha, id], (erro2, resultado2) => {

            if (erro2) {
                console.error('ERRO MYSQL:', erro2);

                return res.status(500).json({
                    mensagem: erro2.message
                });
            }

            res.json({
                mensagem: 'Senha alterada com sucesso!'
            });

        });

    });

});

// =========================
// PUBLICAR ARTIGO
// =========================
app.post('/api/artigos', (req, res) => {

    const { titulo, conteudo, imagem_url, id_autor } = req.body;

    if (!titulo || !conteudo || !id_autor) {
        return res.status(400).json({
            mensagem: 'Título, conteúdo e id_autor são obrigatórios.'
        });
    }

    const sql = `
        INSERT INTO Artigos (titulo, conteudo, imagem_url, id_autor)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [titulo, conteudo, imagem_url || null, id_autor], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        res.status(201).json({
            mensagem: 'Artigo publicado com sucesso!',
            id: resultado.insertId
        });
    });
});

// =========================
// ATUALIZAR ARTIGO (EDITAR)
// =========================
app.put('/api/artigos/:id', (req, res) => {

    const { id } = req.params;
    const { titulo, conteudo, imagem_url } = req.body;

    if (!titulo || !conteudo) {
        return res.status(400).json({
            mensagem: 'Título e conteúdo são obrigatórios.'
        });
    }

    const sql = `
        UPDATE Artigos
        SET titulo = ?, conteudo = ?, imagem_url = ?
        WHERE id_artigo = ?
    `;

    db.query(sql, [titulo, conteudo, imagem_url || null, id], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Artigo não encontrado.'
            });
        }

        res.json({
            mensagem: 'Artigo atualizado com sucesso!'
        });
    });
});

// =========================
// LISTAR COMENTÁRIOS DE UM ARTIGO
// =========================
app.get('/api/artigos/:id/comentarios', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT
            c.*,
            u.nome AS autor_nome,
            u.foto_url AS autor_foto
        FROM Comentarios c
        LEFT JOIN Usuarios u
            ON c.id_usuario = u.id_usuario
        WHERE c.id_artigo = ?
        ORDER BY c.data_envio ASC
    `;

    db.query(sql, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        res.json(resultados);
    });
});

// =========================
// ADICIONAR COMENTÁRIO
// =========================
app.post('/api/artigos/:id/comentarios', (req, res) => {

    const { id } = req.params;
    const { texto, id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(400).json({
            mensagem: 'É necessário estar logado para comentar.'
        });
    }

    if (!texto || !texto.trim()) {
        return res.status(400).json({
            mensagem: 'O comentário não pode estar vazio.'
        });
    }

    const sql = `
        INSERT INTO Comentarios (texto, id_usuario, id_artigo)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [texto.trim(), id_usuario, id], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        res.status(201).json({
            mensagem: 'Comentário adicionado com sucesso!',
            id: resultado.insertId
        });
    });
});

// =========================
// EXCLUIR COMENTÁRIO
// =========================
app.delete('/api/comentarios/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM Comentarios
        WHERE id_comentario = ?
    `;

    db.query(sql, [id], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Comentário não encontrado.'
            });
        }

        res.json({
            mensagem: 'Comentário excluído com sucesso!'
        });
    });
});

// =========================
// LISTAR ARTIGOS DO USUÁRIO
// =========================
app.get('/api/artigos/usuario/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT *
        FROM Artigos
        WHERE id_autor = ?
        ORDER BY data_publicacao DESC
    `;

    db.query(sql, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        res.json(resultados);
    });
});

// =========================
// LISTAR UM ARTIGO
// =========================
app.get('/api/artigos/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT
            a.*,
            u.nome AS autor_nome
        FROM Artigos a
        LEFT JOIN Usuarios u
            ON a.id_autor = u.id_usuario
        WHERE a.id_artigo = ?
        LIMIT 1
    `;

    db.query(sql, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Artigo não encontrado.'
            });
        }

        res.json(resultados[0]);
    });
});

// =========================
// EXCLUIR ARTIGO
// =========================
app.delete('/api/artigos/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM Artigos
        WHERE id_artigo = ?
    `;

    db.query(sql, [id], (erro, resultado) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: erro.message
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Artigo não encontrado.'
            });
        }

        res.json({
            mensagem: 'Artigo excluído com sucesso!'
        });
    });
});

// =========================
// INICIAR SERVIDOR
// =========================
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});