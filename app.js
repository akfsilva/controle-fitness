// ELEMENTOS
const treinoSelect = document.getElementById("treinoSelect");
const listaExercicios = document.getElementById("listaExercicios");
const treinoExecucao = document.getElementById("treinoExecucao");
const healthFill = document.getElementById("health-fill");
let videos = [];
let treinoAtual = null;

// FUNÇÃO DE INÍCIO (INSERIR FICHA)
function startGame() {
    document.getElementById("splash-screen").classList.add("hidden");
    document.getElementById("main-header").classList.remove("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    showFlashEffect("#fff");
}

// INICIALIZAÇÃO
initTreinos();
carregarVideos();
renderTreinos();
initHistorico();

function initTreinos() {
  if (!localStorage.getItem("treinos")) {
    const treinos = {};
    for (let i = 1; i <= 30; i++) treinos[i] = [];
    localStorage.setItem("treinos", JSON.stringify(treinos));
  }
}

function initHistorico() {
  if (!localStorage.getItem("historicoTreinos")) {
    localStorage.setItem("historicoTreinos", JSON.stringify([]));
  }
}

function carregarVideos() {
  fetch("videos/videos.json")
    .then(r => r.json())
    .then(d => { videos = d; renderExercicios(); })
    .catch(e => console.log("Erro ao carregar vídeos"));
}

function getTreinos() { return JSON.parse(localStorage.getItem("treinos")); }
function salvarTreinos(t) { localStorage.setItem("treinos", JSON.stringify(t)); }

function renderTreinos() {
  treinoSelect.innerHTML = "";
  for (let i = 1; i <= 30; i++) {
    treinoSelect.innerHTML += `<option value="${i}">STAGE ${String(i).padStart(2, '0')}</option>`;
  }
  treinoSelect.onchange = renderExercicios;
  renderExercicios();
}

function novoExercicio() {
  const t = getTreinos();
  t[treinoSelect.value].push({ nome:"", series:"", reps:"", carga:"", video:"" });
  salvarTreinos(t);
  renderExercicios();
}

function editar(i, campo, val) {
  const t = getTreinos();
  t[treinoSelect.value][i][campo] = val;
  salvarTreinos(t);
}

function remover(i) {
  const t = getTreinos();
  t[treinoSelect.value].splice(i,1);
  salvarTreinos(t);
  renderExercicios();
}

function renderExercicios() {
  listaExercicios.innerHTML = "";
  const exs = getTreinos()[treinoSelect.value];
  exs.forEach((ex,i)=>{
    listaExercicios.innerHTML += `
      <div class="exercise arcade-card" style="margin-bottom:10px; border-color:#555">
        <input class="arcade-input" value="${ex.nome}" placeholder="MOVE NAME" onchange="editar(${i},'nome',this.value)">
        <div style="display:flex; gap:5px">
            <input class="arcade-input" value="${ex.series}" placeholder="SETS" onchange="editar(${i},'series',this.value)">
            <input class="arcade-input" value="${ex.reps}" placeholder="REPS" onchange="editar(${i},'reps',this.value)">
        </div>
        <select class="arcade-select" onchange="editar(${i},'video',this.value)">
          <option value="">SELECT VFX</option>
          ${videos.map(v=>`<option ${v===ex.video?"selected":""}>${v}</option>`).join("")}
        </select>
        <button class="btn-red" style="width:100%" onclick="remover(${i})">DELETE</button>
      </div>`;
  });
}

function iniciarTreino() {
  treinoAtual = { treino: treinoSelect.value, data: new Date().toISOString(), exercicios: getTreinos()[treinoSelect.value] };
  if(treinoAtual.exercicios.length === 0) return alert("EMPTY COMMAND LIST!");
  
  treinoExecucao.innerHTML = treinoAtual.exercicios.map(e => `
    <div class="battle-unit" style="margin-bottom:20px; border-bottom:2px solid var(--primary)">
        <h3 style="color:var(--primary)">> ${e.nome || 'SPECIAL MOVE'}</h3>
        ${e.video ? `<video src="videos/${e.video}" autoplay loop muted width="100%"></video>` : ""}
    </div>`).join("");
  showFlashEffect("#fff");
}

function finalizarTreino() {
  if (!treinoAtual) return;
  const hist = JSON.parse(localStorage.getItem("historicoTreinos"));
  const calorias = treinoAtual.exercicios.length * 50;
  hist.push({...treinoAtual, calorias});
  localStorage.setItem("historicoTreinos", JSON.stringify(hist));
  
  document.body.style.animation = "shake 0.5s both";
  setTimeout(() => document.body.style.animation = "", 500);
  alert("STAGE CLEAR! SCORE SAVED.");
  renderGraficos();
}

// CRONÔMETRO
let timer, segundos=0;
function startTimer(){
  if(timer) clearInterval(timer);
  timer=setInterval(()=>{
    segundos++;
    document.getElementById("tempo").innerText=format(segundos);
    let barra = 100 - ((segundos % 300) / 300) * 100; // Reseta barra a cada 5 min
    healthFill.style.width = barra + "%";
    healthFill.style.background = barra < 30 ? "red" : "linear-gradient(to bottom, #ffff00, #ff8000)";
  },1000);
}
function pauseTimer(){ clearInterval(timer); }
function resetTimer(){ 
    clearInterval(timer); segundos=0; 
    document.getElementById("tempo").innerText="00:00"; 
    healthFill.style.width = "100%";
}
function format(s){ return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function showFlashEffect(color) {
    const f = document.createElement("div");
    f.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:${color}; z-index:3000; opacity:0.6; pointer-events:none;`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 100);
}

function renderGraficos() {
    const hist = JSON.parse(localStorage.getItem("historicoTreinos")) || [];
    if(hist.length === 0) return;
    const dias = {};
    hist.forEach(h => { const d = h.data.split("T")[0]; dias[d] = (dias[d] || 0) + 1; });

    new Chart(document.getElementById("grafTreinos"), {
        type: "bar",
        data: { labels: Object.keys(dias), datasets: [{ label: "VICTORIES", data: Object.values(dias), backgroundColor: '#d32f2f' }] },
        options: { scales: { y: { beginAtZero: true } } }
    });
}
