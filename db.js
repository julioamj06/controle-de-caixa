const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('banco.sqlite', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado com sucesso.');
  }
});

// Ativa a checagem de foreign keys no SQLite
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL CHECK(preco > 0),
    quantidade INTEGER NOT NULL CHECK(quantidade >= 0)
  )`, (err) => {
    if (err) console.error('Erro ao criar tabela produtos:', err.message);
    else console.log('Tabela produtos pronta.');
  });

  db.run(`CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL CHECK(quantidade > 0),
    valor_unitario REAL NOT NULL CHECK(valor_unitario > 0),
    data TEXT NOT NULL,
    FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE ON UPDATE CASCADE
  )`, (err) => {
    if (err) console.error('Erro ao criar tabela vendas:', err.message);
    else console.log('Tabela vendas pronta.');
  });

  db.run(`CREATE TABLE IF NOT EXISTS saidas_caixa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor REAL NOT NULL CHECK(valor > 0),
    motivo TEXT NOT NULL,
    data TEXT NOT NULL
  )`, (err) => {
    if (err) console.error('Erro ao criar tabela saidas_caixa:', err.message);
    else console.log('Tabela saidas_caixa pronta.');
  });
});

module.exports = db;