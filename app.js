// ELEMENTOS
const treinoSelect = document.getElementById("treinoSelect");
const listaExercicios = document.getElementById("listaExercicios");
const treinoExecucao = document.getElementById("treinoExecucao");
const healthFill = document.getElementById("health-fill");
const tempoDisplay = document.getElementById("tempo");
const xpFill = document.getElementById("xp-fill");
const lvlDisplay = document.getElementById("player-level");

let videos = [];
let treinoAtual = null;
let timer = null;
let segundos = 0;
let restInterval = null;

// INIT
initApp();

function initApp() {
    if (!localStorage.getItem("treinos")) {
        const treinos = {};
        for (let i = 1; i <= 30; i++) treinos[i] = [];
        localStorage.setItem("treinos", JSON.stringify(treinos));
    }
    if (!localStorage.getItem("historicoTreinos")) localStorage.setItem("historicoTreinos", "[]");
    if (!localStorage.getItem("playerXP")) localStorage.setItem("playerXP", "0");

    carregarVideos();
    renderTreinos();
    updatePlayerStats();
}

function startGame() {
    document.getElementById("splash-screen").classList.add("hidden");
    document.getElementById("main-header").classList.remove("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    renderGraficos();
}

function carregarVideos() {
  fetch("videos/videos.json")
    .then(r => r.json())
    .then(d => { videos = d; renderExercicios(); })
    .catch(() => console.log("videos.json não carregado"));
}

function getTreinos() { return JSON.parse(localStorage.getItem("treinos")); }
function salvarTreinos(t) { localStorage.setItem("treinos", JSON.stringify(t)); }

// GESTÃO DE STAGES
function renderTreinos() {
  treinoSelect.innerHTML = "";
  for (let i = 1; i <= 30; i++) {
    treinoSelect.innerHTML += `<option value="${i}">STAGE ${String(i).padStart(2, '0')}${i==30 ? " [BOSS]" : ""}</option>`;
  }
  treinoSelect.onchange = e => {
      renderExercicios();
      document.getElementById("stage-card").className = e.target.value == 30 ? "arcade-card boss-mode" : "arcade-card";
  };
}

function excluirTreino() {
  if (!confirm("LIMPAR STAGE?")) return;
  const t = getTreinos();
  t[treinoSelect.value] = [];
  salvarTreinos(t);
  renderExercicios();
}

// EDITOR
function novoExercicio() {
  const t = getTreinos();
  t[treinoSelect.value].push({ nome:"", series: "3", reps: "10", carga: "0", pr: "0", video:"" });
  salvarTreinos(t);
  renderExercicios();
}

function editar(i, campo, val) {
  const t = getTreinos();
  t[treinoSelect.value][i][campo] = val;
  salvarTreinos(t);
}

function renderExercicios() {
  listaExercicios.innerHTML = "";
  const exs = getTreinos()[treinoSelect.value];
  exs.forEach((ex, i) => {
    listaExercicios.innerHTML += `
      <div class="exercise arcade-card" style="border-color:#555">
        <input class="arcade-input" value="${ex.nome}" placeholder="MOVE NAME" onchange="editar(${i},'nome',this.value)">
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px">
            <input class="arcade-input" value="${ex.series}" placeholder="SETS" onchange="editar(${i},'series',this.value)">
            <input class="arcade-input" value="${ex.reps}" placeholder="REPS" onchange="editar(${i},'reps',this.value)">
            <input class="arcade-input" value="${ex.carga}" placeholder="KG" onchange="editar(${i},'carga',this.value)">
        </div>
        <input class="arcade-input" style="border-color:var(--arcade-blue)" value="${ex.pr || 0}" placeholder="PERSONAL RECORD (PR)" onchange="editar(${i},'pr',this.value)">
        <select class="arcade-select" onchange="editar(${i},'video',this.value)">
          <option value="">SELECT VIDEO</option>
          ${videos.map(v => `<option ${v === ex.video ? "selected" : ""}>${v}</option>`).join("")}
        </select>
        <button class="btn-red" style="width:100%" onclick="remover(${i})">ELIMINAR</button>
      </div>`;
  });
}

function remover(i) {
  const t = getTreinos();
  t[treinoSelect.value].splice(i,1);
  salvarTreinos(t);
  renderExercicios();
}

// ARENA
function iniciarTreino() {
  const exs = getTreinos()[treinoSelect.value];
  if (exs.length === 0) return alert("STAGE VAZIO!");
  treinoAtual = { treino: treinoSelect.value, data: new Date().toISOString(), exercicios: exs };
  
  treinoExecucao.innerHTML = exs.map((e, idx) => {
    const s = parseInt(e.series) || 1;
    let dots = '<div class="series-tracker">';
    for (let i = 1; i <= s; i++) dots += `<div class="serie-dot" onclick="marcarSerie(this, ${idx})">${i}</div>`;
    dots += '</div>';

    return `
    <div class="battle-unit" id="unit-${idx}" style="margin-bottom:20px; border-left:4px solid var(--primary); padding:10px; background:rgba(255,255,255,0.05)">
        <h3 style="color:var(--primary); margin:0;">${e.nome || 'MOVE'} ${e.pr > 0 ? `<span class="pr-badge">[PR: ${e.pr}KG]</span>` : ""}</h3>
        <p style="font-size:0.5rem; color:#aaa;">${e.series}X${e.reps} | ATUAL: ${e.carga}KG</p>
        ${dots}
        ${e.video ? `<video src="videos/${e.video}" autoplay loop muted width="100%" style="border:1px solid #444; margin-top:5px;"></video>` : ""}
    </div>`;
  }).join("");
  showFlashEffect("#fff");
}

function marcarSerie(el, idx) {
    if(!el.classList.contains("done")) {
        startRestTimer();
    }
    el.classList.toggle("done");
    const container = el.parentElement;
    if (container.querySelectorAll(".serie-dot.done").length === container.querySelectorAll(".serie-dot").length) {
        document.getElementById(`unit-${idx}`).classList.add("defeated");
    } else {
        document.getElementById(`unit-${idx}`).classList.remove("defeated");
    }
}

// REST TIMER
function startRestTimer() {
    skipRest();
    const container = document.getElementById("rest-timer-container");
    const display = document.getElementById("rest-seconds");
    container.classList.remove("hidden");
    let sec = 60;
    display.innerText = sec;
    restInterval = setInterval(() => {
        sec--;
        display.innerText = sec;
        if(sec <= 0) skipRest();
    }, 1000);
}

function skipRest() {
    clearInterval(restInterval);
    document.getElementById("rest-timer-container").classList.add("hidden");
}

// FINALIZAÇÃO
function abrirModalFinalizar() {
    if (!treinoAtual) return alert("STAGE NÃO INICIADO!");
    document.getElementById("modal-log").classList.remove("hidden");
}

function confirmarFinalizacao() {
    const hist = JSON.parse(localStorage.getItem("historicoTreinos"));
    const note = document.getElementById("battle-note").value;
    let xpGanho = treinoAtual.exercicios.length * 20;
    if(treinoAtual.treino == 30) xpGanho *= 2; // BOSS XP

    hist.push({ ...treinoAtual, xp: xpGanho, note: note, duracao: segundos }); 
    localStorage.setItem("historicoTreinos", JSON.stringify(hist));
    
    let xpTotal = parseInt(localStorage.getItem("playerXP")) + xpGanho;
    localStorage.setItem("playerXP", xpTotal.toString());
    
    document.getElementById("modal-log").classList.add("hidden");
    stopTimer();
    updatePlayerStats();
    alert(`MISSION COMPLETE! XP: +${xpGanho}`);
    renderGraficos();
}

function updatePlayerStats() {
    const xp = parseInt(localStorage.getItem("playerXP"));
    const level = Math.floor(xp / 100) + 1;
    lvlDisplay.innerText = `LVL. ${String(level).padStart(2, '0')}`;
    xpFill.style.width = `${xp % 100}%`;
}

// TIMER
function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
        segundos++;
        tempoDisplay.innerText = format(segundos);
        let d = 100 - ((segundos % 600) / 600) * 100;
        healthFill.style.width = d + "%";
    }, 1000);
}
function pauseTimer() { clearInterval(timer); timer = null; }
function stopTimer() { pauseTimer(); showFlashEffect("rgba(211,47,47,0.5)"); }
function resetTimer() { stopTimer(); segundos = 0; tempoDisplay.innerText = "00:00"; healthFill.style.width = "100%"; }
function format(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function showFlashEffect(color) {
    const f = document.createElement("div");
    f.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:${color}; z-index:3000; opacity:0.4; pointer-events:none;`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 100);
}

// GRAFICOS
let chart1=null;
function renderGraficos() {
    const hist = JSON.parse(localStorage.getItem("historicoTreinos"));
    if (!hist || hist.length === 0) return;
    const dias = {};
    hist.forEach(h => { const d = h.data.split("T")[0]; dias[d] = (dias[d] || 0) + 1; });
    if(chart1) chart1.destroy();
    chart1 = new Chart(document.getElementById("grafTreinos"), {
        type: "bar",
        data: { labels: Object.keys(dias), datasets: [{ label: "VICTORIES", data: Object.values(dias), backgroundColor: '#ffcc00' }] },
        options: { scales: { y: { ticks: { color: "#fff" } }, x: { ticks: { color: "#fff" } } } }
    });
}
