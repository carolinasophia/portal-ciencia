require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const autenticarToken = require('./middleware/auth');

const app = express();

app.use(helmet());

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
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

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: 'Muitas tentativas de login. Tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
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
app.post('/cadastro', async (req, res) => {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: 'Todos os campos são obrigatórios.'
        });
    }

    if (senha.length < 8) {
        return res.status(400).json({
            mensagem: 'A senha deve ter pelo menos 8 caracteres.'
        });
    }

    try {

        // Transforma a senha em um hash seguro
        const senhaHash = await bcrypt.hash(senha, 12);

        const sql = `
            INSERT INTO Usuarios (nome, email, senha)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [nome, email, senhaHash],
            (erro, resultado) => {

                if (erro) {

                    console.error('ERRO MYSQL:', erro);

                    if (erro.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            mensagem: 'Este e-mail já está cadastrado.'
                        });
                    }

                    return res.status(500).json({
                        mensagem: 'Erro ao cadastrar usuário.'
                    });
                }

                res.status(201).json({
                    mensagem: 'Usuário cadastrado com sucesso!',
                    id: resultado.insertId
                });

            }
        );

    } catch (erro) {

        console.error('ERRO AO GERAR HASH:', erro);

        res.status(500).json({
            mensagem: 'Erro ao processar a senha.'
        });
    }

});
// =========================
// LOGIN
// =========================
app.post('/api/login', loginLimiter, async (req, res) => {

    const { email, password } = req.body;

    // Verifica se os campos foram preenchidos
    if (!email || !password) {
        return res.status(400).json({
            message: 'Preencha todos os campos.'
        });
    }

    const sql = `
        SELECT
            id_usuario,
            nome,
            email,
            senha,
            tipo_usuario,
            foto_url
        FROM Usuarios
        WHERE email = ?
        LIMIT 1
    `;

    db.query(sql, [email], async (erro, resultados) => {

        if (erro) {
            console.error('ERRO NO LOGIN:', erro);

            return res.status(500).json({
                message: 'Erro no servidor.'
            });
        }

        // Não informa se o e-mail existe ou não
        if (resultados.length === 0) {
            return res.status(401).json({
                message: 'E-mail ou senha incorretos.'
            });
        }

        const usuario = resultados[0];

        try {

            // Compara a senha digitada com o hash armazenado
            const senhaCorreta = await bcrypt.compare(
                password,
                usuario.senha
            );

            if (!senhaCorreta) {
                return res.status(401).json({
                    message: 'E-mail ou senha incorretos.'
                });
            }

            // Cria o token JWT
            const token = jwt.sign(
                {
                    id: usuario.id_usuario,
                    tipo: usuario.tipo_usuario
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '2h'
                }
            );

            // Retorna os dados do usuário e o token
            res.json({
                message: 'Login realizado com sucesso!',
                token: token,
                user: {
                    id: usuario.id_usuario,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo_usuario: usuario.tipo_usuario,
                    foto_url: usuario.foto_url
                }
            });

        } catch (erro) {

            console.error('ERRO AO VALIDAR LOGIN:', erro);

            res.status(500).json({
                message: 'Erro ao processar o login.'
            });
        }

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
app.put(
    '/api/usuario/:id/senha',
    autenticarToken,
    async (req, res) => {

    const { id } = req.params;
    if (Number(id) !== Number(req.usuario.id)) {
        return res.status(403).json({
            mensagem: 'Você não pode alterar a senha de outro usuário.'
        });
    }
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
            mensagem: 'Preencha a senha atual e a nova senha.'
        });
    }

    // Regras de segurança da nova senha
    if (novaSenha.length < 8) {
        return res.status(400).json({
            mensagem: 'A nova senha deve ter pelo menos 8 caracteres.'
        });
    }

    // Busca o hash da senha atual
    const sqlBusca = `
        SELECT senha
        FROM Usuarios
        WHERE id_usuario = ?
        LIMIT 1
    `;

    db.query(sqlBusca, [id], async (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao buscar usuário.'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        const usuario = resultados[0];

        try {

            // Verifica a senha atual usando bcrypt
            const senhaAtualCorreta = await bcrypt.compare(
                senhaAtual,
                usuario.senha
            );

            if (!senhaAtualCorreta) {
                return res.status(401).json({
                    mensagem: 'Senha atual incorreta.'
                });
            }

            // Cria o hash da nova senha
            const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

            // Salva o novo hash no banco
            const sqlUpdate = `
                UPDATE Usuarios
                SET senha = ?
                WHERE id_usuario = ?
            `;

            db.query(
                sqlUpdate,
                [novaSenhaHash, id],
                (erro2, resultado2) => {

                    if (erro2) {
                        console.error('ERRO MYSQL:', erro2);

                        return res.status(500).json({
                            mensagem: 'Erro ao atualizar a senha.'
                        });
                    }

                    res.json({
                        mensagem: 'Senha alterada com sucesso!'
                    });

                }
            );

        } catch (erro) {

            console.error('Erro ao processar senha:', erro);

            res.status(500).json({
                mensagem: 'Erro ao processar a senha.'
            });
        }

    });

});

// =========================
// PUBLICAR ARTIGO
// =========================
app.post('/api/artigos', autenticarToken, (req, res) => {

    const { titulo, conteudo, imagem_url } = req.body;

const id_autor = req.usuario.id;

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
// ATUALIZAR ARTIGO
// =========================
app.put('/api/artigos/:id', autenticarToken, (req, res) => {

    const { id } = req.params;
    const { titulo, conteudo, imagem_url } = req.body;

    const idUsuario = req.usuario.id;

    if (!titulo || !conteudo) {
        return res.status(400).json({
            mensagem: 'Título e conteúdo são obrigatórios.'
        });
    }

    // Verifica quem é o dono do artigo
    const sqlVerificar = `
        SELECT id_autor
        FROM Artigos
        WHERE id_artigo = ?
        LIMIT 1
    `;

    db.query(sqlVerificar, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao verificar artigo.'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Artigo não encontrado.'
            });
        }

        const artigo = resultados[0];

        // Verifica se o usuário é o autor
        if (Number(artigo.id_autor) !== Number(idUsuario)) {
            return res.status(403).json({
                mensagem: 'Você não pode editar este artigo.'
            });
        }

        const sqlUpdate = `
            UPDATE Artigos
            SET titulo = ?, conteudo = ?, imagem_url = ?
            WHERE id_artigo = ?
        `;

        db.query(
            sqlUpdate,
            [titulo, conteudo, imagem_url || null, id],
            (erro2, resultado) => {

                if (erro2) {
                    console.error('ERRO MYSQL:', erro2);

                    return res.status(500).json({
                        mensagem: 'Erro ao atualizar artigo.'
                    });
                }

                res.json({
                    mensagem: 'Artigo atualizado com sucesso!'
                });
            }
        );

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
app.delete('/api/artigos/:id', autenticarToken, (req, res) => {

    const { id } = req.params;
    const idUsuario = req.usuario.id;

    const sqlVerificar = `
        SELECT id_autor
        FROM Artigos
        WHERE id_artigo = ?
        LIMIT 1
    `;

    db.query(sqlVerificar, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO MYSQL:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao verificar artigo.'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Artigo não encontrado.'
            });
        }

        const artigo = resultados[0];

        // Verifica se o usuário é o autor
        if (Number(artigo.id_autor) !== Number(idUsuario)) {
            return res.status(403).json({
                mensagem: 'Você não pode excluir este artigo.'
            });
        }

        const sqlDelete = `
            DELETE FROM Artigos
            WHERE id_artigo = ?
        `;

        db.query(sqlDelete, [id], (erro2, resultado) => {

            if (erro2) {
                console.error('ERRO MYSQL:', erro2);

                return res.status(500).json({
                    mensagem: 'Erro ao excluir artigo.'
                });
            }

            res.json({
                mensagem: 'Artigo excluído com sucesso!'
            });
        });

    });

});

// =========================
// TESTE DE VALIDAÇÃO DO TOKEN
// =========================
app.get('/api/teste-token', autenticarToken, (req, res) => {

    res.json({
        mensagem: 'Token válido! Autenticação funcionando.',
        usuario: req.usuario
    });

});

// =========================
// TEORIAS - LISTAR TODAS
// =========================
app.get('/api/teorias', (req, res) => {

    const sql = `
        SELECT
            t.*,
            u.nome AS autor_nome
        FROM Teorias t
        LEFT JOIN Usuarios u
            ON t.id_autor = u.id_usuario
        ORDER BY t.data_publicacao DESC
    `;

    db.query(sql, (erro, resultados) => {

        if (erro) {
            console.error('ERRO AO BUSCAR TEORIAS:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao buscar teorias.'
            });
        }

        res.json(resultados);
    });
});


// =========================
// TEORIAS - BUSCAR UMA
// =========================
app.get('/api/teorias/:id', (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT
            t.*,
            u.nome AS autor_nome
        FROM Teorias t
        LEFT JOIN Usuarios u
            ON t.id_autor = u.id_usuario
        WHERE t.id_teoria = ?
        LIMIT 1
    `;

    db.query(sql, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO AO BUSCAR TEORIA:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao buscar teoria.'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Teoria não encontrada.'
            });
        }

        res.json(resultados[0]);
    });
});


// =========================
// TEORIAS - PUBLICAR
// =========================
app.post('/api/teorias', autenticarToken, (req, res) => {

    const {
        titulo,
        resumo,
        conteudo,
        area,
        imagem_url,
        evidencias,
        referencias
    } = req.body;

    const id_autor = req.usuario.id;

    if (!titulo || !resumo || !conteudo || !area) {
        return res.status(400).json({
            mensagem: 'Título, resumo, conteúdo e área são obrigatórios.'
        });
    }

    const sql = `
        INSERT INTO Teorias (
            titulo,
            resumo,
            conteudo,
            area,
            imagem_url,
            evidencias,
            referencias,
            id_autor
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            titulo,
            resumo,
            conteudo,
            area,
            imagem_url || null,
            evidencias || null,
            referencias || null,
            id_autor
        ],
        (erro, resultado) => {

            if (erro) {
                console.error('ERRO AO PUBLICAR TEORIA:', erro);

                return res.status(500).json({
                    mensagem: 'Erro ao publicar teoria.'
                });
            }

            res.status(201).json({
                mensagem: 'Teoria publicada com sucesso!',
                id: resultado.insertId
            });
        }
    );
});


// =========================
// TEORIAS - ATUALIZAR
// =========================
app.put('/api/teorias/:id', autenticarToken, (req, res) => {

    const { id } = req.params;

    const {
        titulo,
        resumo,
        conteudo,
        area,
        imagem_url,
        evidencias,
        referencias
    } = req.body;

    const idUsuario = req.usuario.id;

    if (!titulo || !resumo || !conteudo || !area) {
        return res.status(400).json({
            mensagem: 'Título, resumo, conteúdo e área são obrigatórios.'
        });
    }

    const sqlVerificar = `
        SELECT id_autor
        FROM Teorias
        WHERE id_teoria = ?
        LIMIT 1
    `;

    db.query(sqlVerificar, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO AO VERIFICAR TEORIA:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao verificar teoria.'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Teoria não encontrada.'
            });
        }

        if (Number(resultados[0].id_autor) !== Number(idUsuario)) {
            return res.status(403).json({
                mensagem: 'Você não pode editar esta teoria.'
            });
        }

        const sqlUpdate = `
            UPDATE Teorias
            SET
                titulo = ?,
                resumo = ?,
                conteudo = ?,
                area = ?,
                imagem_url = ?,
                evidencias = ?,
                referencias = ?
            WHERE id_teoria = ?
        `;

        db.query(
            sqlUpdate,
            [
                titulo,
                resumo,
                conteudo,
                area,
                imagem_url || null,
                evidencias || null,
                referencias || null,
                id
            ],
            (erro2) => {

                if (erro2) {
                    console.error('ERRO AO ATUALIZAR TEORIA:', erro2);

                    return res.status(500).json({
                        mensagem: 'Erro ao atualizar teoria.'
                    });
                }

                res.json({
                    mensagem: 'Teoria atualizada com sucesso!'
                });
            }
        );
    });
});


// =========================
// TEORIAS - EXCLUIR
// =========================
app.delete('/api/teorias/:id', autenticarToken, (req, res) => {

    const { id } = req.params;

    const idUsuario = req.usuario.id;

    const sqlVerificar = `
        SELECT id_autor
        FROM Teorias
        WHERE id_teoria = ?
        LIMIT 1
    `;

    db.query(sqlVerificar, [id], (erro, resultados) => {

        if (erro) {
            console.error('ERRO AO VERIFICAR TEORIA:', erro);

            return res.status(500).json({
                mensagem: 'Erro ao verificar teoria.'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: 'Teoria não encontrada.'
            });
        }

        if (Number(resultados[0].id_autor) !== Number(idUsuario)) {
            return res.status(403).json({
                mensagem: 'Você não pode excluir esta teoria.'
            });
        }

        const sqlDelete = `
            DELETE FROM Teorias
            WHERE id_teoria = ?
        `;

        db.query(sqlDelete, [id], (erro2) => {

            if (erro2) {
                console.error('ERRO AO EXCLUIR TEORIA:', erro2);

                return res.status(500).json({
                    mensagem: 'Erro ao excluir teoria.'
                });
            }

            res.json({
                mensagem: 'Teoria excluída com sucesso!'
            });
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
