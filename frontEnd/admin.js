// frontEnd/admin.js
const fmt = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const tbody = document.getElementById("tbody");

async function carregar(){
  try{
    const res = await fetch(window.API_URL + "/pedidos");
    const pedidos = await res.json();

    if (!Array.isArray(pedidos) || pedidos.length === 0){
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Sem pedidos ainda.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    pedidos.slice().reverse().forEach(p => {
      const tr = document.createElement("tr");
      const itensTxt = p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ");
      const data = new Date(p.dataISO).toLocaleString("pt-BR");

      tr.innerHTML = `
        <td data-label="#ID">${p.id}</td>
        <td data-label="Data">${data}</td>
        <td data-label="Cliente">${p.nomeCliente}</td>
        <td data-label="Observações">${p.observacoes || "-"}</td>
        <td data-label="Itens">${itensTxt}</td>
        <td data-label="Total"><strong>${fmt(p.total)}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="6" class="muted">Erro ao carregar: ${e.message}</td></tr>`;
  }
}
carregar();
