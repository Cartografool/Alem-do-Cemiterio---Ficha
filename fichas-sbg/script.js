let fichas = JSON.parse(localStorage.getItem("fichasSBG_moderna")) || [];
let currentId = null;

const defaultFicha = {
  classeSelecionada: "",
  tipoSelecionado: "",
  id: null,
  nome: "Nova Ficha",
  potencia: 0,
  desempenho: 0,
  resiliencia: 0,
  conhecimento: 0,
  influencia: 0,
  pvAtual: 0,
  pvTotal: 0,
  dano: 0,
  mentAtual: 0,
  mentTotal: 0,
  estab: 0,
  habilidades: [],
  inventario: [],
  bloqueio: 0,
  deslocamento: 0,
};
function saveToStorage() {
  localStorage.setItem("fichasSBG_moderna", JSON.stringify(fichas));
}

function renderLista() {
  const container = document.getElementById("lista-fichas");
  container.innerHTML = "";

  if (fichas.length === 0) {
    container.innerHTML = `<p style="text-align:center; opacity:0.7; padding:60px 20px;">Nenhuma ficha criada ainda.<br>Clique em "+ Nova Ficha"</p>`;
    return;
  }

  fichas.forEach((f) => {
    const card = document.createElement("div");
    card.className = "ficha-card";
    card.innerHTML = `
      <div style="font-size:1.35em; font-weight:600;">${f.nome}</div>
    <button class="btn-delete-ficha" onclick="event.stopImmediatePropagation(); deleteFicha('${f.id}')">
  ✖
</button>
    `;
    card.onclick = () => openFicha(f.id);
    container.appendChild(card);
  });
}

function createNewFicha() {
  if (fichas.length >= 10) {
    alert("Você atingiu o limite de 10 fichas.");
    return;
  }

  const nova = JSON.parse(JSON.stringify(defaultFicha));
  nova.id = "ficha-" + Date.now();
  nova.nome = `Nova Ficha ${fichas.length + 1}`;

  fichas.push(nova);
  saveToStorage();
  renderLista();
  openFicha(nova.id);
}

function openFicha(id) {
  currentId = id;
  const ficha = fichas.find((f) => f.id === id);
  if (!ficha) return;

  document.getElementById("lista-screen").classList.remove("active");
  document.getElementById("ficha-screen").classList.add("active");

  document.getElementById("ficha-nome").innerText = ficha.nome;
  // limpar seleção
  document
    .querySelectorAll("#lista-classes .opcao")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll("#lista-tipos .opcao")
    .forEach((el) => el.classList.remove("selected"));
  const resumoClasse = document.getElementById("resumo-classe");
  const resumoTipo = document.getElementById("resumo-tipo");

  resumoClasse.innerText = ficha.classeSelecionada
    ? ficha.classeSelecionada.toUpperCase()
    : "";

  resumoTipo.innerText = ficha.tipoSelecionado
    ? ficha.tipoSelecionado.toUpperCase()
    : "";
  // aplicar salvo
  if (ficha.classeSelecionada) {
    const el = document.querySelector(
      `#lista-classes .opcao[data-valor="${ficha.classeSelecionada}"]`,
    );
    if (el) el.classList.add("selected");
  }

  if (ficha.tipoSelecionado) {
    const el = document.querySelector(
      `#lista-tipos .opcao[data-valor="${ficha.tipoSelecionado}"]`,
    );
    if (el) el.classList.add("selected");
  }
  // Atributos
  document.querySelector('[data-field="potencia"] .main-value').innerText =
    ficha.potencia || 0;
  document.querySelector('[data-field="desempenho"] .main-value').innerText =
    ficha.desempenho || 0;
  document.querySelector('[data-field="resiliencia"] .main-value').innerText =
    ficha.resiliencia || 0;
  document.querySelector('[data-field="conhecimento"] .main-value').innerText =
    ficha.conhecimento || 0;
  document.querySelector('[data-field="influencia"] .main-value').innerText =
    ficha.influencia || 0;

  const containerInv = document.querySelector(".inventario-lista");
  containerInv.innerHTML = "";

  if (ficha.inventario && ficha.inventario.length > 0) {
    ficha.inventario.forEach((item) => {
      containerInv.appendChild(criarLinhaItem(item));
    });
  }

  // PV e MENT
  document.getElementById("pv-atual").innerText = ficha.pvAtual || 0;
  document.getElementById("pv-total").innerText = ficha.pvTotal || 0;
  document.getElementById("dano").innerText = ficha.dano || 0;

  document.getElementById("ment-atual").innerText = ficha.mentAtual || 0;
  document.getElementById("ment-total").innerText = ficha.mentTotal || 0;
  document.getElementById("estab").innerText = ficha.estab || 0;
  document.getElementById("bloqueio-sec").innerText = ficha.bloqueio || 0;
  document.getElementById("deslocamento-sec").innerText =
    ficha.deslocamento || 0;
  // Base
  document.getElementById("bloqueio-main").innerText = ficha.classeSelecionada
    ? getBaseBloqueio(ficha.classeSelecionada)
    : 0;

  document.getElementById("deslocamento-main").innerText =
    ficha.classeSelecionada ? getBaseDeslocamento(ficha.classeSelecionada) : 0;
  updateAllSecundarios();
  aplicarClasseAutomatico();

  // Abre a aba "PV e MENT"
  mudarAba("inicio");
  const container = document.querySelector(".habilidades-container");
  container.innerHTML = "";

  // Primeiro: habilidades salvas
  if (ficha.habilidades && ficha.habilidades.length > 0) {
    ficha.habilidades.forEach((hab) => {
      const div = document.createElement("div");
      div.className = "habilidade-item";
      div.innerHTML = `
      <input type="text" class="habilidade-nome" value="${hab.nome}">
      <textarea class="habilidade-desc">${hab.desc}</textarea>
    `;
      container.appendChild(div);
    });
  }

  // Depois: completar até 4 espaços
  const totalDesejado = 4;
  const faltando = totalDesejado - container.children.length;

  for (let i = 0; i < faltando; i++) {
    const div = document.createElement("div");
    div.className = "habilidade-item";
    div.innerHTML = `
    <input type="text" class="habilidade-nome" placeholder="Nome da Habilidade">
    <textarea class="habilidade-desc" placeholder="Descrição da habilidade..."></textarea>
  `;
    container.appendChild(div);
  }

  aplicarClasseAutomatico();
}

// Sistema de abas
function mudarAba(aba) {
  document
    .querySelectorAll(".aba-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".aba-conteudo")
    .forEach((content) => content.classList.remove("active"));

  const botao = document.querySelector(`.aba-btn[data-aba="${aba}"]`);
  const conteudo = document.getElementById(`aba-${aba}`);

  if (botao) botao.classList.add("active");
  if (conteudo) conteudo.classList.add("active");
}

// SALVAR FICHA
function saveCurrentFicha() {
  if (!currentId) return;
  const ficha = fichas.find((f) => f.id === currentId);
  if (!ficha) return;

  ficha.nome =
    document.getElementById("ficha-nome").innerText.trim() || "Nova Ficha";

  ficha.potencia =
    parseInt(
      document.querySelector('[data-field="potencia"] .main-value').innerText,
    ) || 0;
  ficha.desempenho =
    parseInt(
      document.querySelector('[data-field="desempenho"] .main-value').innerText,
    ) || 0;
  ficha.resiliencia =
    parseInt(
      document.querySelector('[data-field="resiliencia"] .main-value')
        .innerText,
    ) || 0;
  ficha.conhecimento =
    parseInt(
      document.querySelector('[data-field="conhecimento"] .main-value')
        .innerText,
    ) || 0;
  ficha.influencia =
    parseInt(
      document.querySelector('[data-field="influencia"] .main-value').innerText,
    ) || 0;

  ficha.pvAtual = parseInt(document.getElementById("pv-atual").innerText) || 0;
  ficha.pvTotal = parseInt(document.getElementById("pv-total").innerText) || 0;
  ficha.dano = parseInt(document.getElementById("dano").innerText) || 0;

  ficha.mentAtual =
    parseInt(document.getElementById("ment-atual").innerText) || 0;
  ficha.mentTotal =
    parseInt(document.getElementById("ment-total").innerText) || 0;
  ficha.estab = parseInt(document.getElementById("estab").innerText) || 0;

  const habilidades = [];

  document.querySelectorAll(".habilidade-item").forEach((item) => {
    const nome = item.querySelector(".habilidade-nome").value.trim();
    const desc = item.querySelector(".habilidade-desc").value.trim();

    if (nome || desc) {
      habilidades.push({ nome, desc });
    }
  });
  const classeSel = document.querySelector("#lista-classes .selected");
  const tipoSel = document.querySelector("#lista-tipos .selected");

  ficha.classeSelecionada = classeSel ? classeSel.dataset.valor : "";

  ficha.tipoSelecionado = tipoSel ? tipoSel.dataset.valor : "";
  ficha.habilidades = habilidades;
  const itens = [];

  document.querySelectorAll(".item-linha").forEach((linha) => {
    const nome = linha.querySelector(".item-nome").value;
    const qtd = linha.querySelector(".item-qtd").value;
    const peso = linha.querySelector(".item-peso").value;
    const grau = linha.querySelector(".item-grau").value;
    const usos = linha.querySelector(".item-usos").value;

    if (nome || qtd || peso || grau || usos) {
      itens.push({ nome, qtd, peso, grau, usos });
    }
  });

  ficha.inventario = itens;
  saveToStorage();
  aplicarClasseAutomatico();
}

// Atualiza secundários
function updateAllSecundarios() {
  const mappings = {
    potencia: "pot-sec",
    desempenho: "des-sec",
    resiliencia: "res-sec",
    conhecimento: "con-sec",
    influencia: "inf-sec",
  };

  Object.keys(mappings).forEach((field) => {
    const main = document.querySelector(`[data-field="${field}"] .main-value`);
    const sec = document.getElementById(mappings[field]);
    if (main && sec) {
      const valor = parseInt(main.innerText) || 0;
      sec.innerText = Math.max(0, valor - 1);
    }
  });
}
function criarLinhaItem(dados = {}) {
  const div = document.createElement("div");
  div.className = "item-linha";

  div.innerHTML = `
    <input type="text" class="item-nome" value="${dados.nome || ""}" placeholder="Nome do item">
    <input type="number" class="item-qtd" value="${dados.qtd || ""}">
    <input type="text" class="item-peso" value="${dados.peso || ""}">
    <input type="text" class="item-grau" value="${dados.grau || ""}">
    <input type="text" class="item-usos" value="${dados.usos || ""}">

    <button class="btn-remover-item">✖</button>
  `;

  return div;
}
// Atualiza PV e MENT
function updatePV() {
  const total = parseInt(document.getElementById("pv-total").innerText) || 0;
  const dano = parseInt(document.getElementById("dano").innerText) || 0;
  document.getElementById("pv-atual").innerText = Math.max(0, total - dano);
}

function updateMENT() {
  const total = parseInt(document.getElementById("ment-total").innerText) || 0;
  const perda = parseInt(document.getElementById("estab").innerText) || 0;
  document.getElementById("ment-atual").innerText = Math.max(0, total - perda);
}

// FUNÇÕES AUXILIARES
function showLista() {
  saveCurrentFicha();
  document.getElementById("ficha-screen").classList.remove("active");
  document.getElementById("lista-screen").classList.add("active");
  renderLista();
}

function deleteFicha(id) {
  if (!confirm("Excluir esta ficha?")) return;
  fichas = fichas.filter((f) => f.id !== id);
  if (currentId === id) showLista();
  saveToStorage();
  renderLista();
}

// EVENTOS
let saveTimeout;
document.addEventListener("input", (e) => {
  if (!currentId) return;

  clearTimeout(saveTimeout);

  const target = e.target;

  if (target.id === "dano" || target.id === "pv-total") updatePV();
  else if (target.id === "estab" || target.id === "ment-total") updateMENT();
  else if (target.classList.contains("main-value")) updateAllSecundarios();

  // salva QUALQUER alteração (inputs também)
  saveTimeout = setTimeout(saveCurrentFicha, 500);
});

document.addEventListener("click", (e) => {
  // ABAS
  if (e.target.classList.contains("aba-btn")) {
    const aba = e.target.getAttribute("data-aba");
    if (aba) mudarAba(aba);
  }

  // CLASSES / TIPOS
  if (e.target.classList.contains("opcao")) {
    const parent = e.target.parentElement;

    parent
      .querySelectorAll(".opcao")
      .forEach((el) => el.classList.remove("selected"));

    e.target.classList.add("selected");

    // RESUMO
    const resumoClasse = document.getElementById("resumo-classe");
    const resumoTipo = document.getElementById("resumo-tipo");

    if (parent.id === "lista-classes") {
      resumoClasse.innerText = "Classe escolhida: " + e.target.innerText;
    }

    if (parent.id === "lista-tipos") {
      resumoTipo.innerText = "Tipo escolhido: " + e.target.innerText;
    }

    saveCurrentFicha();
    aplicarClasseAutomatico();
  }
  // REMOVER ITEM
  if (e.target.classList.contains("btn-remover-item")) {
    const linha = e.target.closest(".item-linha");
    if (linha) linha.remove();

    saveCurrentFicha();
  }
});
window.onload = () => {
  renderLista();

  document.getElementById("btn-nova-ficha").onclick = createNewFicha;
  document.getElementById("btn-minhas-fichas").onclick = showLista;
  document.getElementById("btn-voltar").onclick = showLista;

  document.getElementById("btn-add-item").onclick = () => {
    const container = document.querySelector(".inventario-lista");
    container.appendChild(criarLinhaItem());
    saveCurrentFicha();
  };
};
function getBaseBloqueio(classe) {
  switch (classe) {
    case "Psicótico":
      return 3;
    case "Impaciente":
      return 4;
    case "Valente":
      return 2;
    case "Caladão":
      return 4;
    case "Perdedor":
      return 2;
    case "Delicado":
      return 2;
    default:
      return 0;
  }
}

function getBaseDeslocamento(classe) {
  switch (classe) {
    case "Psicótico":
      return 4;
    case "Impaciente":
      return 5;
    case "Valente":
      return 3;
    case "Caladão":
      return 6;
    case "Perdedor":
      return 3;
    case "Delicado":
      return 3;
    default:
      return 0;
  }
}
function aplicarClasseAutomatico() {
  if (!currentId) return;

  const ficha = fichas.find((f) => f.id === currentId);
  if (!ficha) return;

  const con = ficha.conhecimento || 0;
  const des = ficha.desempenho || 0;

  let ment = 0;

  // MENT (continua no switch ou onde estiver)
  switch (ficha.classeSelecionada) {
    case "Psicótico":
      ment = 4 + con;
      break;
    case "Impaciente":
      ment = 6 + con;
      break;
    case "Valente":
      ment = 7 + con;
      break;
    case "Caladão":
      ment = 7 + con;
      break;
    case "Perdedor":
      ment = 8 + con;
      break;
    case "Delicado":
      ment = 5 + con;
      break;
    default:
      return;
  }

  // funções
  const bloqueioBase = getBaseBloqueio(ficha.classeSelecionada);
  const deslocamentoBase = getBaseDeslocamento(ficha.classeSelecionada);

  const bloqueioTotal = bloqueioBase;
  const deslocamentoTotal = deslocamentoBase + des;

  // salvar
  ficha.mentTotal = ment;
  ficha.bloqueio = bloqueioTotal;
  ficha.deslocamento = deslocamentoTotal;

  document.getElementById("bloqueio-main").innerText = bloqueioBase;
  document.getElementById("deslocamento-main").innerText = deslocamentoBase;

  // secundário
  document.getElementById("bloqueio-sec").innerText = bloqueioTotal;
  document.getElementById("deslocamento-sec").innerText = deslocamentoTotal;

  document.getElementById("ment-total").innerText = ment;

  updateMENT();
}
