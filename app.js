const STORAGE_KEY = "fighterTreinosV2";

let treinos = JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  nome: `Treino ${i + 1}`,
  exercicios: []
}));

const treinoSelect = document.getElementById("treinoSelect");
const treinoAtivo = document.getElementById("treinoAtivo");
const exerciciosDiv = document.getElementById("exercicios");
const progressoDiv = document.getElementById("progresso");
const titulo = document.getElementById("treinoTitulo");

const montagemTreino = document.getElementById("montagemTreino");
const listaExercicios = document.getElementById("listaExercicios");

let progresso = {};
let timerInterval = null;

/* ---------- FUNÇÕES INICIAIS ---------- */

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(treinos));
}

function carregarTreinos() {
  treinoSelect.innerHTML = "";
  treinos.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = t.nome;
    treinoSelect.appendChild(opt);
  });
}

carregarTreinos();

/* ---------- MONTAGEM DE TREINO ---------- */

async function abrirMontagem() {
  montagemTreino.classList.remove("hidden");
  listaExercicios.innerHTML = "";

  const treino = treinos[treinoSelect.value];

  // Importar vídeos do GitHub
  const videoList = await importarVideosGitHub();

  treino.exercicios.forEach((ex, i) => {
    const div = document.createElement("div");
    div.className = "exerciseMontagem";
    div.innerHTML = `
      <h3>Exercício ${i+1}</h3>
      Nome: <input type="text" value="${ex.nome}" onchange="editarExercicio(${i}, 'nome', this.value)">
      Séries: <input type="number" value="${ex.series}" min="1" onchange="editarExercicio(${i}, 'series', this.value)">
      Reps: <input type="number" value="${ex.reps}" min="1" onchange="editarExercicio(${i}, 'reps', this.value)">
      Carga: <input type="text" value="${ex.carga}" onchange="editarExercicio(${i}, 'carga', this.value)">
      Vídeo: <select onchange="editarExercicio(${i}, 'video', this.value)">
        ${videoList.map(v => `<option value="${v}" ${v===ex.video?'selected':''}>${v}</option>`).join("")}
      </select>
      <button onclick="removerExercicio(${i})">REMOVER</button>
    `;
    listaExercicios.appendChild(div);
  });

  // Botão adicionar
  const addBtn = document.createElement("button");
  addBtn.textContent = "ADICIONAR EXERCÍCIO";
  addBtn.onclick = () => {
    treino.exercicios.push({nome:"Novo exercício", video:"", series:3, reps:10, carga:""});
    abrirMontagem();
  };
  listaExercicios.appendChild(addBtn);
}

function editarExercicio(index, campo, valor) {
  treinos[treinoSelect.value].exercicios[index][campo] = campo==='series'||campo==='reps'?parseInt(valor):valor;
}

function removerExercicio(index) {
  treinos[treinoSelect.value].exercicios.splice(index,1);
  abrirMontagem();
}

function salvarMontagem() {
  salvar();
  montarTreinoSelect();
  montagemTreino.classList.add("hidden");
}

function fecharMontagem() {
  montagemTreino.classList.add("hidden");
}

/* ---------- IMPORTAR VÍDEOS DO GITHUB ---------- */

async function importarVideosGitHub() {
  const base = 'https://akfsilva.github.io/fighter-training/videos/';
  try {
    const response = await fetch(base);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html,"text/html");
    const links = Array.from(doc.querySelectorAll('a'))
                      .map(a => a.getAttribute('href'))
                      .filter(h => h.endsWith(".mp4") || h.endsWith(".mkv"));
    return links.map(l => base + l);
  } catch(e) {
    console.error("Erro ao importar vídeos", e);
    return [];
  }
}

/* ---------- TREINO ATIVO ---------- */

function iniciarTreino() {
  const treino = treinos[treinoSelect.value];
  titulo.textContent = treino.nome;
  exerciciosDiv.innerHTML = "";
  progresso = {};

  treino.exercicios.forEach((ex, i) => {
    progresso[i] = Array(ex.series).fill(false);

    const div = document.createElement("div");
    div.className = "exercise";

    div.innerHTML = `
      <h3>${ex.nome}</h3>

      ${ex.video ? `
        <video src="${ex.video}" controls loop></video>
        <button onclick="removerVideo(${treinoSelect.value}, ${i})">REMOVER VÍDEO</button>
      ` : `<p>📴 Sem vídeo</p>`}

      <p>${ex.series} x ${ex.reps} • ${ex.carga}</p>

      <div class="series">
        ${Array.from({ length: ex.series }, (_, s) => `
          <label>
            <input type="checkbox" onchange="marcarSerie(${i}, ${s})">
            Série ${s + 1}
          </label>
        `).join("")}
      </div>

      <div class="timer">
        <button onclick="iniciarTimer(30)">30s</button>
        <button onclick="iniciarTimer(60)">60s</button>
        <button onclick="iniciarTimer(90)">90s</button>
        <span id="timerDisplay"></span>
      </div>
    `;

    exerciciosDiv.appendChild(div);
  });

  treinoAtivo.classList.remove("hidden");
  atualizarProgresso();
}

function finalizarTreino() {
  alert("🔥 TREINO FINALIZADO 🔥");
  treinoAtivo.classList.add("hidden");
}

/* ---------- PROGRESSO ---------- */

function marcarSerie(ex, s) {
  progresso[ex][s] = !progresso[ex][s];
  atualizarProgresso();
}

function atualizarProgresso() {
  const total = Object.values(progresso).flat().length;
  const feitas = Object.values(progresso).flat().filter(v => v).length;
  progressoDiv.textContent =
    total ? `Progresso: ${Math.round((feitas / total) * 100)}%` : "";
}

/* ---------- TIMER ---------- */

function iniciarTimer(segundos) {
  clearInterval(timerInterval);
  let restante = segundos;
  const display = document.getElementById("timerDisplay");

  timerInterval = setInterval(() => {
    display.textContent = `⏱️ ${restante}s`;
    restante--;

    if (restante < 0) {
      clearInterval(timerInterval);
      display.textContent = "🔥 FIGHT! 🔥";
    }
  }, 1000);
}

/* ---------- EXCLUSÕES ---------- */

function removerVideo(treinoIndex, exercicioIndex) {
  treinos[treinoIndex].exercicios[exercicioIndex].video = null;
  salvar();
  iniciarTreino();
}

function excluirTreino() {
  if (!confirm("Excluir este treino permanentemente?")) return;
  treinos.splice(treinoSelect.value, 1);
  salvar();
  carregarTreinos();
  treinoAtivo.classList.add("hidden");
}

/* ---------- DASHBOARD ---------- */

function abrirDashboard() {
  document.getElementById("dashboard").classList.remove("hidden");

  // Frequência de treinos
  const freqCtx = document.getElementById("graficoFrequencia").getContext("2d");
  new Chart(freqCtx, {
    type: 'bar',
    data: {
      labels: treinos.map(t=>t.nome),
      datasets:[{
        label:'Séries completadas',
        data: treinos.map(t=>t.exercicios.reduce((sum, ex)=>sum + ex.series,0)),
        backgroundColor:'#ffeb3b'
      }]
    }
  });

  // Estimativa calorias
  const calCtx = document.getElementById("graficoCalorias").getContext("2d");
  new Chart(calCtx, {
    type:'line',
    data:{
      labels: treinos.map(t=>t.nome),
      datasets:[{
        label:'Calorias estimadas',
        data: treinos.map(t=>t.exercicios.reduce((sum, ex)=>sum + ex.series*ex.reps*5,0)),
        borderColor:'#00e676',
        fill:false
      }]
    }
  });
}

function fecharDashboard() {
  document.getElementById("dashboard").classList.add("hidden");
}
