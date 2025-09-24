// frontend/app.js
const $ = (sel) => document.querySelector(sel);
const fmt = (v) => v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });

let CARDAPIO = [];
const CARRINHO = new Map(); // key: id, value: {id, nome, preco, quantidade}

async function carregarCardapio(){
  const res = await fetch(`${window.API_URL}/cardapio`);
  CARDAPIO = await res.json();
  preencherCategorias();
  renderLista();
}

function preencherCategorias(){
  const select = $("#categoria");
  const cats = [...new Set(CARDAPIO.map(i => i.categoria))].sort();
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    select.appendChild(opt);
  });
}

function filtrarCardapio(){
  const termo = $("#busca").value.trim().toLowerCase();
  const cat = $("#categoria").value;
  return CARDAPIO.filter(i =>
    (!cat || i.categoria === cat) &&
    (!termo || i.nome.toLowerCase().includes(termo))
  );
}

function renderLista(){
  const lista = $("#lista");
  lista.innerHTML = "";
  const itens = filtrarCardapio();
  if (itens.length === 0) {
    lista.innerHTML = `<p class="muted">Nenhum item encontrado.</p>`;
    return;
  }
  itens.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <span class="badge">${item.categoria}</span>
      <h3>${item.nome}</h3>
      <div class="price">${fmt(item.preco)}</div>
      <button aria-label="Adicionar ${item.nome}">Adicionar</button>
      <div class="qty" hidden>
        <button class="menos">-</button>
        <span class="qtd">1</span>
        <button class="mais">+</button>
      </div>
    `;
    const btnAdd = card.querySelector("button");
    const qtyBox = card.querySelector(".qty");
    const qtdEl = card.querySelector(".qtd");

    btnAdd.addEventListener("click", () => {
      addItem(item, 1);
      btnAdd.hidden = true;
      qtyBox.hidden = false;
      qtdEl.textContent = CARRINHO.get(item.id).quantidade;
    });
    card.querySelector(".menos").addEventListener("click", () => {
      addItem(item, -1);
      const q = CARRINHO.get(item.id)?.quantidade || 0;
      if (q <= 0) { btnAdd.hidden = false; qtyBox.hidden = true; }
      else { qtdEl.textContent = q; }
    });
    card.querySelector(".mais").addEventListener("click", () => {
      addItem(item, +1);
      qtdEl.textContent = CARRINHO.get(item.id).quantidade;
    });

    lista.appendChild(card);
  });
}

function addItem(item, delta){
  const atual = CARRINHO.get(item.id) || { ...item, quantidade:0 };
  atual.quantidade = Math.max(0, atual.quantidade + delta);
  if (atual.quantidade === 0) CARRINHO.delete(item.id);
  else CARRINHO.set(item.id, atual);
  renderCarrinho();
}

function renderCarrinho(){
  const ul = $("#carrinho");
  const vazio = $("#carrinhoVazio");
  ul.innerHTML = "";
  let total = 0;

  const itens = [...CARRINHO.values()];
  if (itens.length === 0){
    vazio.style.display = "block";
    $("#btnEnviar").disabled = true;
    $("#total").textContent = fmt(0);
    return;
  }
  vazio.style.display = "none";
  $("#btnEnviar").disabled = false;

  itens.forEach(i => {
    const li = document.createElement("li");
    const subtotal = i.preco * i.quantidade;
    total += subtotal;
    li.className = "item-row";
    li.innerHTML = `
      <div class="name">${i.nome} <span class="muted">(${fmt(i.preco)})</span></div>
      <div class="controls">
        <button data-id="${i.id}" data-op="-">-</button>
        <span>${i.quantidade}</span>
        <button data-id="${i.id}" data-op="+">+</button>
      </div>
      <div><strong>${fmt(subtotal)}</strong></div>
    `;
    ul.appendChild(li);
  });

  // delegação de eventos +/- no carrinho
  ul.onclick = (e) => {
    if (e.target.tagName !== "BUTTON") return;
    const id = Number(e.target.dataset.id);
    const op = e.target.dataset.op;
    const item = CARDAPIO.find(x => x.id === id);
    addItem(item, op === "+" ? 1 : -1);
  };

  $("#total").textContent = fmt(total);
}

async function enviarPedido(e){
  e.preventDefault();
  const msg = $("#msg");
  msg.className = "msg"; msg.textContent = "";

  const nomeCliente = $("#nomeCliente").value.trim();
  const observacoes = $("#observacoes").value.trim();
  const itens = [...CARRINHO.values()].map(i => ({
    id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade
  }));
  if (!nomeCliente || itens.length === 0){
    msg.classList.add("err"); msg.textContent = "Preencha o nome e adicione itens.";
    return;
  }

  $("#btnEnviar").disabled = true;
  try{
    const res = await fetch(`${window.API_URL}/pedidos`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ nomeCliente, observacoes, itens })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Falha ao enviar.");

    msg.classList.add("ok"); msg.textContent = "Pedido enviado! #" + data.pedido.id;
    // limpa carrinho e form
    CARRINHO.clear(); renderCarrinho();
    $("#formPedido").reset();
  }catch(err){
    msg.classList.add("err"); msg.textContent = "Erro: " + err.message;
  }finally{
    $("#btnEnviar").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#busca").addEventListener("input", renderLista);
  $("#categoria").addEventListener("change", renderLista);
  $("#formPedido").addEventListener("submit", enviarPedido);
  carregarCardapio();
});

// ==== Login Admin ====
const modal = document.querySelector("#loginModal");
document.querySelector("#btnAdmin").addEventListener("click", ()=> modal.hidden = false);
document.querySelector("#btnClose").addEventListener("click", ()=> modal.hidden = true);
document.querySelector("#btnLogin").addEventListener("click", ()=>{
  const u = document.querySelector("#adminUser").value.trim();
  const p = document.querySelector("#adminPass").value.trim();
  const msg = document.querySelector("#loginMsg");
  msg.className = "msg"; msg.textContent = "";
  if(u==="admin" && p==="admin"){
    window.location.href = "admin.html";
  }else{
    msg.classList.add("err");
    msg.textContent = "Usuário ou senha inválidos.";
  }
});
