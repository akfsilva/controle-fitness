let trainings = JSON.parse(localStorage.getItem("trainings")) || [];
let templates = JSON.parse(localStorage.getItem("templates")) || [];
let currentExercises = [];

/* TEMPLATE 30 DIAS */
function generateTemplate(){
  templates = [];
  for(let i=1;i<=30;i++){
    let d = new Date();
    d.setDate(d.getDate() + (i-1));
    templates.push({
      date: d.toISOString().slice(0,10),
      treino: i
    });
  }
  localStorage.setItem("templates", JSON.stringify(templates));
  alert("Treinos 1 a 30 criados!");
}

/* TREINO */
function addExercise(){
  const name = exName.value;
  const sets = +exSets.value;
  const reps = +exReps.value;
  const load = +exLoad.value;
  const file = exVideo.files[0];

  if(!name || !sets || !reps) return;

  const calories = sets * reps * (load > 0 ? 0.3 : 0.2);
  const video = file ? URL.createObjectURL(file) : null;

  currentExercises.push({name, sets, reps, load, calories, video});
  renderExercises();
}

function renderExercises(){
  exerciseList.innerHTML = "";
  currentExercises.forEach(e=>{
    exerciseList.innerHTML += `
      <p><b>${e.name}</b> — ${e.sets}x${e.reps} | ${e.load}kg</p>
    `;
  });
}

function saveTraining(){
  const date = trainingDate.value;
  const treino = trainingNumber.value;

  if(!date || !treino || currentExercises.length === 0) return;

  trainings.push({
    date,
    treino,
    exercises: currentExercises,
    totalCalories: currentExercises.reduce((t,e)=>t+e.calories,0)
  });

  localStorage.setItem("trainings", JSON.stringify(trainings));
  currentExercises = [];
  exerciseList.innerHTML = "";
  drawDashboard();
  populateExerciseHistory();
}

/* DASHBOARD */
function drawDashboard(){
  const days = [...Array(7)].map((_,i)=>{
    let d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0,10);
  }).reverse();

  const freq = days.map(d =>
    trainings.filter(t=>t.date===d).length
  );

  const volume = days.map(d =>
    trainings.filter(t=>t.date===d)
      .reduce((v,t)=>
        v + t.exercises.reduce((x,e)=>x + (e.sets * e.reps * e.load),0)
      ,0)
  );

  new Chart(freqChart,{
    type:"bar",
    data:{labels:days,datasets:[{label:"Frequência",data:freq}]}
  });

  new Chart(volumeChart,{
    type:"line",
    data:{labels:days,datasets:[{label:"Volume",data:volume}]}
  });
}

/* HISTÓRICO POR EXERCÍCIO */
function populateExerciseHistory(){
  const names = [...new Set(
    trainings.flatMap(t=>t.exercises.map(e=>e.name))
  )];

  exerciseHistorySelect.innerHTML = "";
  names.forEach(n=>{
    exerciseHistorySelect.innerHTML += `<option>${n}</option>`;
  });
}

function drawExerciseHistory(){
  const name = exerciseHistorySelect.value;

  const data = trainings.flatMap(t =>
    t.exercises
      .filter(e=>e.name===name)
      .map(e=>({date:t.date, load:e.load}))
  );

  new Chart(exerciseHistoryChart,{
    type:"line",
    data:{
      labels:data.map(d=>d.date),
      datasets:[{label:"Carga (kg)", data:data.map(d=>d.load)}]
    }
  });
}

drawDashboard();
populateExerciseHistory();

