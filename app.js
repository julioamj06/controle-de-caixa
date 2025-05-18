const express = require('express');
const path = require('path');
const db = require('./db');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de Produtos
app.post('/produtos', (req, res) => {
  const { nome, preco, quantidade } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome do produto é obrigatório e deve ser texto' });
  }
  if (isNaN(preco) || preco <= 0) {
    return res.status(400).json({ erro: 'Preço deve ser um número positivo' });
  }
  if (!Number.isInteger(quantidade) || quantidade < 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser um número inteiro >= 0' });
  }

  db.run(
    'INSERT INTO produtos(nome, preco, quantidade) VALUES (?, ?, ?)',
    [nome.trim(), preco, quantidade],
    (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao cadastrar' });
      res.json({ sucesso: true });
    }
  );
});

app.get('/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar' });

    const produtos = rows.map(p => ({
      ...p,
      status: p.quantidade <= 0 ? 'Sem estoque' : 'Disponível'
    }));

    res.json(produtos);
  });
});

// Rota de Venda
app.post('/vendas', (req, res) => {
  let {produto_id, quantidade} = req.body;
  produto_id = parseInt(produto_id);

  if (!produto_id || !Number.isInteger(produto_id)) {
    return res.status(400).json({ erro: 'ID do produto inválido' });
  }
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser inteiro positivo' });
  }

  const data = new Date().toISOString();

  db.get('SELECT * FROM produtos WHERE id = ?', [produto_id], (err, produto) => {
    if (err) return res.status(500).json({ erro: 'Erro no banco de dados' });
    if (!produto) return res.status(400).json({ erro: 'Produto não encontrado' });
    if (produto.quantidade < quantidade) return res.status(400).json({ erro: 'Estoque insuficiente' });

    db.run(
      'INSERT INTO vendas(produto_id, quantidade, valor_unitario, data) VALUES (?, ?, ?, ?)',
      [produto_id, quantidade, produto.preco, data],
      (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao registrar venda' });

        db.run(
          'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?',
          [quantidade, produto_id],
          (err2) => {
            if (err2) return res.status(500).json({ erro: 'Erro ao atualizar estoque' });
            res.json({ sucesso: true });
          }
        );
      }
    );
  });
});

// Relatórios
app.get('/relatorios', (req, res) => {
  const dias = parseInt(req.query.dias);

  if (isNaN(dias) || dias <= 0) {
    return res.status(400).json({ erro: 'Parâmetro "dias" inválido' });
  }

  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);
  const inicioISO = inicio.toISOString();

  db.all(
    'SELECT v.*, p.nome FROM vendas v JOIN produtos p ON p.id = v.produto_id WHERE v.data >= ? ORDER BY v.data DESC',
    [inicioISO],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: 'Erro no relatório' });
      res.json(rows);
    }
  );
});

// Saída de caixa
app.post('/saida', (req, res) => {
  const { valor, motivo } = req.body;

  if (isNaN(valor) || valor <= 0) {
    return res.status(400).json({ erro: 'Valor deve ser um número positivo' });
  }
  if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
    return res.status(400).json({ erro: 'Motivo é obrigatório' });
  }

  const data = new Date().toISOString();

  db.run(
    'INSERT INTO saidas_caixa (valor, motivo, data) VALUES (?, ?, ?)',
    [valor, motivo.trim(), data],
    (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao registrar saída' });
      res.json({ sucesso: true });
    }
  );
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));