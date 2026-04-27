/* --- DATA DATABASE --- */
const db = {
  aptitude: [
    { q: "What is 15% of 200?", o: ["20", "25", "30", "35"], a: 2 },
    { q: "Next in series: 2, 4, 8, 16, ...", o: ["20", "24", "30", "32"], a: 3 },
    { q: "Odd one out: Apple, Banana, Carrot, Mango", o: ["Apple", "Banana", "Carrot", "Mango"], a: 2 },
    { q: "Speed = Distance / ?", o: ["Time", "Mass", "Force", "Accel"], a: 0 },
    { q: "Usually, map top indicates?", o: ["South", "North", "East", "West"], a: 1 },
    { q: "5 + 3 * 2 = ?", o: ["16", "11", "10", "13"], a: 1 },
    { q: "Square root of 144?", o: ["10", "11", "12", "13"], a: 2 },
    { q: "30% of 50 is?", o: ["15", "20", "25", "10"], a: 0 },
    { q: "Opposite of 'Dark'?", o: ["Night", "Black", "Light", "Dim"], a: 2 },
    { q: "Which is a prime number?", o: ["4", "9", "11", "15"], a: 2 }
  ],
  web: [
    { q: "Tag for largest heading?", o: ["<h6>", "<head>", "<h1>", "<header>"], a: 2 },
    { q: "Which is NOT a valid color?", o: ["red", "#000", "rgb(0,0,0)", "text-color"], a: 3 },
    { q: "JS variable declaration?", o: ["var", "let", "const", "All"], a: 3 },
    { q: "CSS stands for?", o: ["Color Style", "Cascading Style Sheet", "Computer Style", "None"], a: 1 },
    { q: "Which tag inserts a line break?", o: ["<br>", "<lb>", "<break>", "<hr>"], a: 0 },
    { q: "HTML stands for?", o: ["HyperText Markup", "HighText Make", "HyperTool Multi", "None"], a: 0 },
    { q: "Correct CSS syntax?", o: ["body:color=black", "body {color: black;}", "{body;color:black}", "None"], a: 1 },
    { q: "Symbol for ID in CSS?", o: [".", "#", "@", "!"], a: 1 },
    { q: "Inside which HTML element do we put JS?", o: ["<js>", "<scripting>", "<script>", "<javascript>"], a: 2 },
    { q: "Which is a JS framework?", o: ["React", "Laravel", "Django", "Flask"], a: 0 }
  ],
  computer: [
    {q: "What is called brain of computer?", o: ["CPU", "UPS", "RAM", "ROM"], a: 0},
    {q: "Full form of RAM?", o: ["Read Access Memory", "Random Access Memory", "Run Accept Memory", "None"], a: 1},
    {q: "Which is not an input device?", o: ["Keyboard", "Mouse", "Monitor", "Scanner"], a: 2},
    {q: "What does HTTP stand for?", o: ["HyperText Transfer Protocol", "HighText Transfer Protocol", "HyperText Translate Protocol", "None"], a: 0},
    {q: "Which is used to create web pages?", o: ["HTML", "CSS", "JS", "All"], a: 3}
  ],
  mental: [
    { q: "Do you feel stressed often?", o: ["Yes", "No", "Sometimes", "Rarely"], a: null },
    { q: "How is your sleep quality?", o: ["Good", "Average", "Poor", "Insomnia"], a: null },
    { q: "Can you focus easily?", o: ["Yes", "No", "Depends", "Hardly"], a: null },
    { q: "Do you exercise?", o: ["Daily", "Weekly", "Rarely", "Never"], a: null },
    { q: "Overall mood today?", o: ["Happy", "Neutral", "Sad", "Anxious"], a: null }
  ]
};

/* --- VARIABLES --- */
let user = "";
let currentType = "";
let currentQuiz = [];
let answers = [];
let currentIdx = 0;
let timerObj = null;
let timeSec = 120;
let isReviewMode = false;
let tempResultStats = { correct: 0, attempted: 0 }; 
let warningCount = 0;

/* --- DOM ELEMENTS --- */
const $ = (id) => document.getElementById(id);
const screens = ["screen-home", "screen-subjects", "screen-quiz", "screen-result"];

/* --- HELPERS --- */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* --- NAVIGATION --- */
function showScreen(id) {
  screens.forEach(s => $(s).classList.add("hidden"));
  $(id).classList.remove("hidden");
}

function startApp() {
  const nameInput = $("username").value.trim();
  if (!nameInput || nameInput.length < 3) {
    $("error-msg").innerText = "Name must be at least 3 chars!";
    $("error-msg").classList.remove("hidden");
    return;
  }
  user = nameInput.replace(/\s+/g, '_'); 
  $("user-display").innerText = `User: ${nameInput}`;
  showScreen("screen-subjects");
}

function logout() { location.reload(); }

function goHome() {
  showScreen("screen-subjects");
  currentType = ""; currentIdx = 0;
}

/* --- HISTORY CHECK --- */
function checkHistory(type) {
  if(!db[type]) return alert("Data Not Found!");
  currentType = type;
  
  const storageKey = `result_${user}_${type}`;
  const savedData = localStorage.getItem(storageKey);

  if (savedData) {
    const parsedData = JSON.parse(savedData);
    currentQuiz = parsedData.quizData || db[type];
    answers = parsedData.answers;
    tempResultStats.correct = parsedData.score;
    tempResultStats.attempted = parsedData.attempted;
    showResultScreen(true);
  } else {
    startNewQuiz();
  }
}

function startNewQuiz() {
  currentQuiz = shuffleArray([...db[currentType]]);
  answers = new Array(currentQuiz.length).fill(null);
  currentIdx = 0;
  timeSec = (currentType === 'computer') ? 60 : 120;
  isReviewMode = false;
  warningCount = 0;
  
  $("total-q").innerText = currentQuiz.length;
  $("submitBtn").classList.add("hidden");
  $("reviewBackBtn").classList.add("hidden");
  $("nextBtn").classList.remove("hidden");
  
  showScreen("screen-quiz");
  loadQuestion(0);
  renderPalette();
  startTimer();
}

/* --- QUIZ ENGINE --- */
function loadQuestion(idx) {
  currentIdx = idx;
  $("current-q").innerText = idx + 1;
  const qData = currentQuiz[idx];
  $("question-text").innerText = qData.q;
  const cont = $("options-container");
  cont.innerHTML = "";

  qData.o.forEach((opt, i) => {
    const btn = document.createElement("div");
    btn.className = "option-label";
    if (answers[idx] === i) btn.classList.add("selected");
    
    if(isReviewMode) {
      if (i === qData.a) btn.classList.add("correct"); 
      else if (answers[idx] === i && i !== qData.a) btn.classList.add("wrong");
      btn.style.pointerEvents = "none";
    } else {
      btn.onclick = () => selectOption(i);
    }
    btn.innerHTML = `<span>${opt}</span>`;
    cont.appendChild(btn);
  });

  updateButtons();
  renderPalette();
}

function selectOption(optIndex) {
  answers[currentIdx] = optIndex;
  loadQuestion(currentIdx);
}

function updateButtons() {
  $("prevBtn").disabled = currentIdx === 0;
  
  if (currentIdx === currentQuiz.length - 1) {
    $("nextBtn").classList.add("hidden");
    if(!isReviewMode) $("submitBtn").classList.remove("hidden");
  } else {
    $("nextBtn").classList.remove("hidden");
    $("submitBtn").classList.add("hidden");
  }
}

function changeQ(dir) { loadQuestion(currentIdx + dir); }

document.addEventListener('keydown', (e) => {
  if ($("screen-quiz").classList.contains("hidden")) return;
  if (e.key === "ArrowRight" && currentIdx < currentQuiz.length - 1) changeQ(1);
  if (e.key === "ArrowLeft" && currentIdx > 0) changeQ(-1);
});

/* --- SECURITY: AUTO SUBMIT ON TAB SWITCH --- */
document.addEventListener("visibilitychange", function() {
  if (document.hidden && !$("screen-quiz").classList.contains("hidden") && !isReviewMode) {
    warningCount++;
    document.title = `⚠️ Warning ${warningCount}/3`;
    
    if (warningCount > 3) {
        alert("🚨 Security Violation: Test Auto-Submitted due to multiple tab switches!");
        submitQuiz(); 
    } else {
        alert(`⚠️ Warning ${warningCount}/3: Do not switch tabs! Test will submit automatically after 3 warnings.`);
    }
  } else {
    document.title = "SkillCheck Portal";
  }
});

function renderPalette() {
  const p = $("palette");
  p.innerHTML = "";
  currentQuiz.forEach((_, i) => {
    const btn = document.createElement("button");
    let extraClass = "";
    if (isReviewMode) {
        if(answers[i] === currentQuiz[i].a) extraClass = "p-correct";
        else if(answers[i] !== null) extraClass = "p-wrong";
    }
    btn.className = `p-btn ${i === currentIdx ? 'active' : ''} ${answers[i] !== null ? 'filled' : ''} ${extraClass}`;
    btn.innerText = i + 1;
    btn.onclick = () => loadQuestion(i);
    p.appendChild(btn);
  });
}

function startTimer() {
  clearInterval(timerObj);
  timerObj = setInterval(() => {
    timeSec--;
    const m = Math.floor(timeSec / 60);
    const s = timeSec % 60;
    $("timer").innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
    if (timeSec <= 0) { clearInterval(timerObj); submitQuiz(); }
  }, 1000);
}

/* --- SUBMISSION --- */
function submitQuiz() {
  clearInterval(timerObj);
  let correct = 0; let attempted = 0;
  answers.forEach((ans, i) => {
    if (ans !== null) attempted++;
    if (ans === currentQuiz[i].a) correct++;
  });

  tempResultStats.correct = correct;
  tempResultStats.attempted = attempted;
  
  const storageKey = `result_${user}_${currentType}`;
  localStorage.setItem(storageKey, JSON.stringify({
    answers: answers, 
    score: correct, 
    attempted: attempted, 
    quizData: currentQuiz, 
    warnings: warningCount,
    date: new Date().toLocaleDateString()
  }));

  showResultScreen(false);
}

function showResultScreen(isHistory = false) {
  const correct = tempResultStats.correct;
  const attempted = tempResultStats.attempted;
  const total = currentQuiz.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  // Percentile Logic (Rule-based)
  let percentile = 0;
  if(percentage === 100) percentile = 99.9;
  else if(percentage >= 90) percentile = 95 + Math.random()*2;
  else if(percentage >= 80) percentile = 85 + Math.random()*2;
  else if(percentage >= 60) percentile = 70 + Math.random()*2;
  else if(percentage >= 40) percentile = 50 + Math.random()*2;
  else percentile = percentage * 0.8;
  
  // Update UI Stats
  $("score-text").innerText = `${percentage}%`;
  $("stat-attempt").innerText = `${attempted}/${total}`;
  $("stat-correct").innerText = correct;
  $("stat-percentile").innerText = `${percentile.toFixed(1)}%ile`;
  
  const circle = document.querySelector(".score-circle");
  circle.style.background = `conic-gradient(#8b5cf6 ${percentage * 3.6}deg, #334155 0deg)`;

  let msg = percentage >= 40 ? "Qualified! 🎉" : "Not Qualified ⚠️";
  if(percentage > 80) msg = "Top Performer! 🌟";
  if(isHistory) msg = "Result Loaded 📂";
  
  $("result-greeting").innerText = msg;
  showScreen("screen-result");
}

/* --- REVIEW & RETAKE --- */
function reviewQuiz() {
  isReviewMode = true;
  showScreen("screen-quiz");
  loadQuestion(0);
  $("timer").innerText = "REVIEW MODE";
  $("submitBtn").classList.add("hidden");
  $("reviewBackBtn").classList.remove("hidden");
}

function finishReview() {
  isReviewMode = false;
  showResultScreen(true);
}

function retakeQuiz() {
  if(confirm("Delete previous score and start fresh?")) {
    localStorage.removeItem(`result_${user}_${currentType}`);
    startNewQuiz();
  }
}

/* --- SMART ANALYSIS SYSTEM --- */
function generateAnalysis() {
  const categories = ['aptitude', 'web', 'computer'];
  let reportHTML = "";
  let totalWarnings = 0;

  categories.forEach(sub => {
    const key = `result_${user}_${sub}`;
    const saved = localStorage.getItem(key);
    let subName = sub.charAt(0).toUpperCase() + sub.slice(1);
    
    if (saved) {
      const data = JSON.parse(saved);
      const totalQ = data.quizData ? data.quizData.length : db[sub].length;
      const percentage = Math.round((data.score / totalQ) * 100);
      
      const attemptWarnings = data.warnings || 0;
      if(attemptWarnings > 0) totalWarnings++;

      let status = percentage >= 70 ? '<span class="strong-badge">Strong</span>' : 
                   percentage >= 40 ? '<span style="color:orange">Average</span>' : 
                   '<span class="weak-badge">Weak</span>';

      let warningBadge = attemptWarnings > 0 ? `<span class="warning-badge">⚠️ Flagged</span>` : "";

      reportHTML += `
        <div class="analysis-item">
            <div style="display:flex; justify-content:space-between;">
                <strong>${subName}</strong>
                <span>${percentage}% (${status}) ${warningBadge}</span>
            </div>
        </div>`;
    } else {
      reportHTML += `
        <div class="analysis-item">
            <div style="display:flex; justify-content:space-between; opacity:0.5;">
                <strong>${subName}</strong>
                <span>Not Attempted</span>
            </div>
        </div>`;
    }
  });

  let advice = "";
  if (reportHTML === "") {
    advice = "Please attempt tests first.";
  } else {
    if (totalWarnings > 0) {
      advice = `🚨 <strong>Integrity Alert:</strong> Irregular behavior (tab switching) detected. This impacts the reliability of your assessment.`;
    } else {
      advice = `🌟 <strong>Clean Record:</strong> You followed all exam protocols. Your performance metrics are reliable.`;
    }
  }

  const finalHTML = `${reportHTML}<div class="advice-box">${advice}</div>`;
  $("analysis-body").innerHTML = finalHTML;
  $("analysis-modal").classList.remove("hidden");
}

function closeAnalysis() {
  $("analysis-modal").classList.add("hidden");
}