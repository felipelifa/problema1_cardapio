// backend/server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = __dirname;
const CARDAPIO_PATH = path.join(DATA_DIR, "cardapio.json");
const PEDIDOS_PATH  = path.join(DATA_DIR, "pedidos.json");

app.use(cors());
app.use(express.json());

// util simples de leitura/escrita segura
function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8") || "[]"); }
  catch { return []; }
}
function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

// GET /cardapio -> lista itens do cardápio
app.get("/cardapio", (_req, res) => {
  const itens = readJSON(CARDAPIO_PATH);
  res.json(itens);
});

// GET /pedidos -> (opcional) listar pedidos salvos
app.get("/pedidos", (_req, res) => {
  const pedidos = readJSON(PEDIDOS_PATH);
  res.json(pedidos);
});

// POST /pedidos -> cria novo pedido
// body: { nomeCliente: string, observacoes?: string, itens: [{id, nome, preco, quantidade}] }
app.post("/pedidos", (req, res) => {
  const { nomeCliente, observacoes = "", itens } = req.body || {};

  if (!nomeCliente || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ ok:false, message:"Dados inválidos: informe nomeCliente e itens." });
  }

  // calcula totais
  const itensNormalizados = itens.map(i => ({
    id: i.id,
    nome: i.nome,
    preco: Number(i.preco),
    quantidade: Number(i.quantidade),
    subtotal: Number(i.preco) * Number(i.quantidade)
  }));
  const total = itensNormalizados.reduce((acc, i) => acc + i.subtotal, 0);

  const pedidos = readJSON(PEDIDOS_PATH);
  const novo = {
    id: Date.now().toString(),
    dataISO: new Date().toISOString(),
    nomeCliente,
    observacoes,
    itens: itensNormalizados,
    total
  };
  pedidos.push(novo);
  writeJSON(PEDIDOS_PATH, pedidos);

  res.status(201).json({ ok:true, message:"Pedido recebido com sucesso!", pedido: novo });
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});
