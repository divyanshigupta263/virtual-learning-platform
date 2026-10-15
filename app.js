/**
 * Virtual Learning Platform - Frontend Application Logic (Pure JavaScript)
 * BCA Final Year Project
 * 
 * Features:
 * 1. AI Mock Interview (Question generation, deep evaluation, score & feedback)
 * 2. Mock Test Dashboard (Timed quizzes, AI dynamic quiz generator, auto-grading)
 * 3. AI Viva Oral Examiner (Text-to-Speech audio, Voice recognition speech typing, verdict)
 */

// =========================================================================
// 0. CONFIGURATION & SERVER CONNECTIVITY
// =========================================================================
// If running through Express, port is 5000. If running through Live Server (port 5500), connect to port 5000!
const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

// Check backend health on page load
window.addEventListener('DOMContentLoaded', async () => {
  refreshIcons();
  await checkServerHealth();
  await loadTestCatalog();
});

// Helper to refresh Lucide SVG icons whenever the DOM changes
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Helper to format ISO timestamp into readable Date & Time (e.g. Oct 15, 2026 • 8:15 PM)
function formatDateTime(isoString) {
  if (!isoString) return 'Just now';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Recently';
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} • ${timeStr}`;
}

// Health check function
async function checkServerHealth() {
  const statusText = document.getElementById('server-status-text');
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    if (res.ok) {
      statusText.innerText = 'AI Server Online';
    } else {
      statusText.innerText = 'Server Notice';
    }
  } catch (e) {
    statusText.innerText = 'Server Offline (Start server)';
    console.warn('Backend server not reachable at:', API_BASE);
  }
}

// =========================================================================
// 1. NAVIGATION TAB SWITCHING
// =========================================================================
function switchTab(tabName) {
  // Hide all modules
  document.getElementById('module-interview').classList.add('hidden');
  document.getElementById('module-test').classList.add('hidden');
  document.getElementById('module-viva').classList.add('hidden');

  // Reset tab buttons
  ['interview', 'test', 'viva'].forEach((t) => {
    const btn = document.getElementById(`tab-${t}`);
    btn.className = 'nav-tab inactive-tab';
  });

  // Activate chosen module and button
  document.getElementById(`module-${tabName}`).classList.remove('hidden');
  const activeBtn = document.getElementById(`tab-${tabName}`);
  activeBtn.className = 'nav-tab active-tab';

  refreshIcons();
}

// =========================================================================
// 2. MODULE 1: AI MOCK INTERVIEW
// =========================================================================
let interviewQuestions = [];
let interviewCurrentIndex = 0;
let interviewTopic = '';
let isInterviewHistoryOpen = false;

// Start Interview Simulation
async function startInterviewSession() {
  const topicSelect = document.getElementById('interview-topic');
  const difficultySelect = document.getElementById('interview-difficulty');
  const countSelect = document.getElementById('interview-count');
  const startBtn = document.getElementById('btn-start-interview');

  interviewTopic = topicSelect.value;
  const difficulty = difficultySelect.value;
  const questionCount = countSelect.value;

  startBtn.disabled = true;
  startBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Generating Questions with Gemini AI...`;

  try {
    const res = await fetch(`${API_BASE}/api/interview/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: interviewTopic, difficulty, questionCount: Number(questionCount) })
    });
    const data = await res.json();

    if (data.success && data.questions && data.questions.length > 0) {
      interviewQuestions = data.questions;
      interviewCurrentIndex = 0;

      // Show Active Interview Card & hide setup card
      document.getElementById('interview-setup-card').classList.add('hidden');
      document.getElementById('interview-active-card').classList.remove('hidden');

      displayCurrentInterviewQuestion();
    } else {
      alert(data.error || 'Failed to generate interview questions.');
    }
  } catch (err) {
    alert('Error connecting to backend: ' + err.message);
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = `<i data-lucide="bot" class="w-4 h-4 inline mr-1"></i> Start Interview Simulation`;
    refreshIcons();
  }
}

// Display Question at Current Index
function displayCurrentInterviewQuestion() {
  document.getElementById('interview-progress-badge').innerText = `Question ${interviewCurrentIndex + 1} of ${interviewQuestions.length}`;
  document.getElementById('interview-active-topic').innerText = interviewTopic;
  document.getElementById('interview-question-text').innerText = interviewQuestions[interviewCurrentIndex];

  // Clear answer box & hide previous evaluation
  document.getElementById('interview-answer-input').value = '';
  document.getElementById('interview-answer-input').disabled = false;
  document.getElementById('btn-submit-answer').classList.remove('hidden');
  document.getElementById('interview-evaluation-card').classList.add('hidden');
  refreshIcons();
}

// Submit Answer for AI Evaluation
async function submitInterviewAnswer() {
  const answerInput = document.getElementById('interview-answer-input');
  const answer = answerInput.value.trim();
  const submitBtn = document.getElementById('btn-submit-answer');

  if (!answer) {
    alert('Please type your answer before submitting.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> AI is Evaluating Your Answer...`;

  try {
    const res = await fetch(`${API_BASE}/api/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: interviewTopic,
        question: interviewQuestions[interviewCurrentIndex],
        answer
      })
    });
    const data = await res.json();

    if (data.success && data.evaluation) {
      renderInterviewEvaluation(data.evaluation);
    } else {
      alert(data.error || 'Evaluation failed.');
    }
  } catch (err) {
    alert('Error evaluating answer: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4 inline mr-1"></i> Submit Answer for AI Evaluation`;
    refreshIcons();
  }
}

// Render Evaluation Score & Feedback
function renderInterviewEvaluation(evaluation) {
  const evalCard = document.getElementById('interview-evaluation-card');
  const submitBtn = document.getElementById('btn-submit-answer');
  const answerInput = document.getElementById('interview-answer-input');

  // Lock answer input
  answerInput.disabled = true;
  submitBtn.classList.add('hidden');

  // Score
  document.getElementById('eval-score').innerText = evaluation.score;

  // Correctness badge
  const correctnessBadge = document.getElementById('eval-correctness');
  correctnessBadge.innerText = evaluation.correctness || 'Evaluated';
  if (evaluation.score >= 80) {
    correctnessBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else if (evaluation.score >= 50) {
    correctnessBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300';
  } else {
    correctnessBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300';
  }

  // Feedback & suggestions
  document.getElementById('eval-feedback').innerText = evaluation.feedback || 'Good attempt.';
  document.getElementById('eval-suggestions').innerText = evaluation.improvementSuggestions || 'Keep practicing core topics.';

  // Missing points list
  const missingList = document.getElementById('eval-missing-points');
  missingList.innerHTML = '';
  if (evaluation.missingPoints && evaluation.missingPoints.length > 0) {
    evaluation.missingPoints.forEach((point) => {
      const li = document.createElement('li');
      li.innerText = point;
      missingList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerText = 'No major points missed!';
    missingList.appendChild(li);
  }

  // Update Next Button text
  const nextBtn = document.getElementById('btn-next-question');
  if (interviewCurrentIndex + 1 < interviewQuestions.length) {
    nextBtn.innerHTML = `<span>Next Question (${interviewCurrentIndex + 2}/${interviewQuestions.length})</span> <i data-lucide="arrow-right" class="w-4 h-4 inline"></i>`;
  } else {
    nextBtn.innerHTML = `<span>Finish Session</span> <i data-lucide="check-circle-2" class="w-4 h-4 inline"></i>`;
  }

  evalCard.classList.remove('hidden');
  refreshIcons();
}

// Next Question Handler
function nextInterviewQuestion() {
  if (interviewCurrentIndex + 1 < interviewQuestions.length) {
    interviewCurrentIndex++;
    displayCurrentInterviewQuestion();
  } else {
    alert('Congratulations! You completed this interview simulation session.');
    resetInterviewSession();
  }
}

// Reset Session
function resetInterviewSession() {
  document.getElementById('interview-setup-card').classList.remove('hidden');
  document.getElementById('interview-active-card').classList.add('hidden');
  interviewQuestions = [];
  interviewCurrentIndex = 0;
  refreshIcons();
}

// Toggle & Fetch Interview History
async function toggleInterviewHistory() {
  const container = document.getElementById('interview-history-container');
  const list = document.getElementById('interview-history-list');

  if (isInterviewHistoryOpen) {
    container.classList.add('hidden');
    isInterviewHistoryOpen = false;
    return;
  }

  container.classList.remove('hidden');
  isInterviewHistoryOpen = true;
  list.innerHTML = `<p class="text-xs text-slate-500 py-3 text-center">Loading past interview records...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/interview/history/all`);
    const data = await res.json();

    if (data.success && data.history && data.history.length > 0) {
      list.innerHTML = '';
      data.history.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm';
        
        const isViva = item.type === 'viva';
        const displayScore = isViva ? `${item.score}/10` : `${item.score}/100`;

        row.innerHTML = `
          <div>
            <span class="font-semibold text-indigo-700">${item.topic || item.subject}</span>
            <span class="text-xs text-slate-500 ml-2">(${item.type || 'interview'})</span>
            <p class="text-xs text-slate-600 mt-1 line-clamp-1">${item.question || ''}</p>
          </div>
          <div class="text-right">
            <span class="text-base font-extrabold text-emerald-600">${displayScore}</span>
            <p class="text-[10px] text-slate-400">${formatDateTime(item.savedAt)}</p>
          </div>
        `;
        list.appendChild(row);
      });
    } else {
      list.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past interviews saved yet.</p>`;
    }
  } catch (err) {
    list.innerHTML = `<p class="text-xs text-rose-500 py-3 text-center">Error loading history: ${err.message}</p>`;
  }
}

// Clear Interview History
async function clearInterviewHistoryData() {
  if (!confirm('Are you sure you want to clear all saved interview history?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/interview/history/clear`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      document.getElementById('interview-history-list').innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past interviews saved yet.</p>`;
    }
  } catch (err) {
    alert('Failed to clear interview history: ' + err.message);
  }
}

// =========================================================================
// 3. MODULE 2: MOCK TEST & ASSESSMENT
// =========================================================================
let currentActiveTest = null;
let currentTestAnswers = {};
let testTimerInterval = null;
let testSecondsRemaining = 0;
let isTestHistoryOpen = false;

// Fetch Available Test Catalog
async function loadTestCatalog() {
  const grid = document.getElementById('test-catalog-grid');
  grid.innerHTML = `<p class="text-xs text-slate-500 col-span-2 py-4 text-center">Loading practice tests...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/test`);
    const data = await res.json();

    if (data.success && data.tests) {
      grid.innerHTML = '';
      data.tests.forEach((test) => {
        const card = document.createElement('div');
        card.className = 'p-5 bg-white border border-slate-200 rounded-2xl hover:border-violet-400 hover:shadow-md transition flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-bold text-slate-900">${test.title}</h4>
              <span class="px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-semibold border border-violet-100">
                ${test.difficulty || 'Intermediate'}
              </span>
            </div>
            <p class="text-xs text-slate-500 flex items-center gap-2 mb-4">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-violet-600"></i> ${test.durationMinutes} Minutes • ${test.totalQuestions} Questions
            </p>
          </div>
          <button onclick="startTest('${test.id}')" class="w-full py-2.5 bg-slate-50 hover:bg-violet-600 hover:text-white text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200 flex items-center justify-center gap-2">
            <span>Start Test</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        `;
        grid.appendChild(card);
      });
      refreshIcons();
    }
  } catch (err) {
    grid.innerHTML = `<p class="text-xs text-rose-500 col-span-2 py-4 text-center">Failed to load tests: ${err.message}</p>`;
  }
}

// Generate Custom AI Quiz via Gemini
async function generateAiQuiz() {
  const topicInput = document.getElementById('ai-quiz-topic');
  const difficultySelect = document.getElementById('ai-quiz-difficulty');
  const genBtn = document.getElementById('btn-generate-ai-quiz');

  const topic = topicInput.value.trim();
  if (!topic) {
    alert('Please enter a topic for the AI quiz (e.g. Python, Docker, DSA).');
    return;
  }

  genBtn.disabled = true;
  genBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Generating Quiz...`;

  try {
    const res = await fetch(`${API_BASE}/api/test/generate-ai-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty: difficultySelect.value, questionCount: 3 })
    });
    const data = await res.json();

    if (data.success && data.test) {
      launchTestRunner(data.test);
      loadTestCatalog(); // Refresh catalog in background
    } else {
      alert(data.error || 'Failed to generate AI quiz.');
    }
  } catch (err) {
    alert('Error generating AI test: ' + err.message);
  } finally {
    genBtn.disabled = false;
    genBtn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 inline mr-1"></i> Generate & Start`;
    refreshIcons();
  }
}

// Start a Test by ID
async function startTest(testId) {
  try {
    const res = await fetch(`${API_BASE}/api/test/${testId}`);
    const data = await res.json();

    if (data.success && data.test) {
      launchTestRunner(data.test);
    } else {
      alert(data.error || 'Failed to load test.');
    }
  } catch (err) {
    alert('Error loading test: ' + err.message);
  }
}

// Launch the Active Test Runner
function launchTestRunner(test) {
  currentActiveTest = test;
  currentTestAnswers = {};

  // Switch views
  document.getElementById('test-catalog-container').classList.add('hidden');
  document.getElementById('test-runner-container').classList.remove('hidden');
  document.getElementById('test-result-summary').classList.add('hidden');
  document.getElementById('runner-action-bar').classList.remove('hidden');

  // Set titles
  document.getElementById('runner-test-title').innerText = test.title;
  document.getElementById('runner-test-subject').innerText = `${test.subject} • ${test.questions.length} Questions`;

  // Render Questions
  const questionsList = document.getElementById('runner-questions-list');
  questionsList.innerHTML = '';

  test.questions.forEach((q, qIdx) => {
    const qBox = document.createElement('div');
    qBox.id = `qbox-${q.id}`;
    qBox.className = 'p-5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3';

    let optionsHtml = '';
    q.options.forEach((opt, optIdx) => {
      optionsHtml += `
        <button id="opt-${q.id}-${optIdx}" onclick="selectQuizOption('${q.id}', ${optIdx})" class="quiz-option-btn">
          <span>${opt}</span>
          <span id="opt-icon-${q.id}-${optIdx}"></span>
        </button>
      `;
    });

    qBox.innerHTML = `
      <p class="font-semibold text-slate-900 text-sm">
        ${qIdx + 1}. ${q.question}
      </p>
      <div class="space-y-2">
        ${optionsHtml}
      </div>
      <div id="explanation-${q.id}" class="hidden mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600"></div>
    `;
    questionsList.appendChild(qBox);
  });

  // Start Countdown Timer
  startTestTimer(test.durationMinutes || 10);
  refreshIcons();
}

// Option Click Handler
function selectQuizOption(questionId, optionIndex) {
  currentTestAnswers[questionId] = optionIndex;

  // Clear 'selected' from peer buttons of same question
  const qBox = document.getElementById(`qbox-${questionId}`);
  const buttons = qBox.querySelectorAll('.quiz-option-btn');
  buttons.forEach((btn) => btn.classList.remove('selected'));

  // Mark clicked button as selected
  const chosenBtn = document.getElementById(`opt-${questionId}-${optionIndex}`);
  if (chosenBtn) {
    chosenBtn.classList.add('selected');
  }
}

// Countdown Timer Handler
function startTestTimer(durationMinutes) {
  if (testTimerInterval) clearInterval(testTimerInterval);

  testSecondsRemaining = durationMinutes * 60;
  updateTimerDisplay();

  testTimerInterval = setInterval(() => {
    testSecondsRemaining--;
    updateTimerDisplay();

    if (testSecondsRemaining <= 0) {
      clearInterval(testTimerInterval);
      alert('Time is up! Auto-submitting your test.');
      submitTestAnswers();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(testSecondsRemaining / 60);
  const secs = testSecondsRemaining % 60;
  const timerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const display = document.getElementById('runner-timer-text');
  if (display) {
    display.innerText = timerText;
  }
}

// Submit Test Answers for Auto-Grading
async function submitTestAnswers() {
  if (testTimerInterval) clearInterval(testTimerInterval);

  const submitBtn = document.getElementById('btn-submit-test');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Scoring Your Answers...';

  try {
    const res = await fetch(`${API_BASE}/api/test/${currentActiveTest.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: currentTestAnswers })
    });
    const data = await res.json();

    if (data.success) {
      renderTestResults(data);
    } else {
      alert(data.error || 'Submission failed.');
    }
  } catch (err) {
    alert('Error submitting test: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Submit Test for Scoring';
    refreshIcons();
  }
}

// Render Results & Scorecard
function renderTestResults(data) {
  document.getElementById('runner-action-bar').classList.add('hidden');
  const summaryCard = document.getElementById('test-result-summary');

  // Stats
  document.getElementById('test-stat-score').innerText = `${data.summary.correctCount} / ${data.summary.totalQuestions}`;
  document.getElementById('test-stat-percentage').innerText = `${data.summary.scorePercentage}%`;
  document.getElementById('test-stat-grade').innerText = data.summary.grade;

  // Passed / Failed Badge
  const passBadge = document.getElementById('test-passed-badge');
  if (data.summary.passed) {
    passBadge.innerText = 'PASSED';
    passBadge.className = 'px-4 py-1.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else {
    passBadge.innerText = 'NEEDS IMPROVEMENT';
    passBadge.className = 'px-4 py-1.5 rounded-full font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300';
  }

  // Highlight Options (Green for correct, Red for chosen wrong) and show explanation
  data.breakdown.forEach((item) => {
    const correctBtn = document.getElementById(`opt-${item.questionId}-${item.correctOptionIndex}`);
    if (correctBtn) {
      correctBtn.classList.add('correct');
      const iconSpan = document.getElementById(`opt-icon-${item.questionId}-${item.correctOptionIndex}`);
      if (iconSpan) iconSpan.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 inline"></i>`;
    }

    if (!item.isCorrect && item.selectedOptionIndex !== null) {
      const wrongBtn = document.getElementById(`opt-${item.questionId}-${item.selectedOptionIndex}`);
      if (wrongBtn) {
        wrongBtn.classList.add('wrong');
        const iconSpan = document.getElementById(`opt-icon-${item.questionId}-${item.selectedOptionIndex}`);
        if (iconSpan) iconSpan.innerHTML = `<i data-lucide="x-circle" class="w-4 h-4 text-rose-600 inline"></i>`;
      }
    }

    // Explanation
    const expBox = document.getElementById(`explanation-${item.questionId}`);
    if (expBox) {
      expBox.innerHTML = `<strong>Explanation:</strong> ${item.explanation}`;
      expBox.classList.remove('hidden');
    }
  });

  // Disable all option buttons
  document.querySelectorAll('.quiz-option-btn').forEach((btn) => {
    btn.disabled = true;
  });

  summaryCard.classList.remove('hidden');
  refreshIcons();
}

// Exit Test Runner
function exitTestRunner() {
  if (testTimerInterval) clearInterval(testTimerInterval);
  document.getElementById('test-runner-container').classList.add('hidden');
  document.getElementById('test-catalog-container').classList.remove('hidden');
  currentActiveTest = null;
  currentTestAnswers = {};
  refreshIcons();
}

// Toggle & Fetch Past Test History
async function toggleTestHistory() {
  const container = document.getElementById('test-history-container');
  const list = document.getElementById('test-history-list');

  if (isTestHistoryOpen) {
    container.classList.add('hidden');
    isTestHistoryOpen = false;
    return;
  }

  container.classList.remove('hidden');
  isTestHistoryOpen = true;
  list.innerHTML = `<p class="text-xs text-slate-500 py-3 text-center">Loading past test records...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/test/history/all`);
    const data = await res.json();

    if (data.success && data.history && data.history.length > 0) {
      list.innerHTML = '';
      data.history.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm';
        row.innerHTML = `
          <div>
            <span class="font-semibold text-violet-700">${item.testTitle}</span>
            <p class="text-xs text-slate-500 mt-0.5">
              ${item.correctCount}/${item.totalQuestions} correct • Grade ${item.grade}
            </p>
          </div>
          <div class="text-right">
            <span class="text-base font-extrabold ${item.passed ? 'text-emerald-600' : 'text-rose-600'}">
              ${item.scorePercentage}%
            </span>
            <p class="text-[10px] text-slate-400">${formatDateTime(item.savedAt)}</p>
          </div>
        `;
        list.appendChild(row);
      });
    } else {
      list.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past test records saved yet.</p>`;
    }
  } catch (err) {
    list.innerHTML = `<p class="text-xs text-rose-500 py-3 text-center">Error loading history: ${err.message}</p>`;
  }
}

// Clear Test History
async function clearTestHistoryData() {
  if (!confirm('Are you sure you want to clear all saved test records?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/test/history/clear`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      document.getElementById('test-history-list').innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past test records saved yet.</p>`;
    }
  } catch (err) {
    alert('Failed to clear test history: ' + err.message);
  }
}

// =========================================================================
// 4. MODULE 3: AI VIVA (ORAL EXAMINER)
// =========================================================================
let currentVivaSubject = '';
let currentVivaQuestion = '';
let currentExaminerFeedback = '';
let isSpeechRecognitionActive = false;
let speechRecognizer = null;
let isVivaHistoryOpen = false;

// Start Viva Session
async function startVivaSession() {
  const subjectSelect = document.getElementById('viva-subject');
  const topicInput = document.getElementById('viva-topic');
  const startBtn = document.getElementById('btn-start-viva');

  currentVivaSubject = subjectSelect.value;
  const topic = topicInput.value.trim() || 'Core Fundamentals';

  startBtn.disabled = true;
  startBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Calling AI Examiner...`;

  try {
    const res = await fetch(`${API_BASE}/api/interview/viva/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: currentVivaSubject, topic })
    });
    const data = await res.json();

    if (data.success && data.question) {
      currentVivaQuestion = data.question;

      document.getElementById('viva-setup-card').classList.add('hidden');
      document.getElementById('viva-active-card').classList.remove('hidden');
      document.getElementById('viva-evaluation-card').classList.add('hidden');

      document.getElementById('viva-active-subject').innerText = currentVivaSubject;
      document.getElementById('viva-question-text').innerText = currentVivaQuestion;
      document.getElementById('viva-answer-input').value = '';

      // Automatically speak the examiner question aloud!
      speakTextAloud(currentVivaQuestion);
    } else {
      alert(data.error || 'Failed to generate viva question.');
    }
  } catch (err) {
    alert('Error connecting to backend: ' + err.message);
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = `<i data-lucide="mic" class="w-4 h-4 inline mr-1"></i> Enter Viva Room & Ask Examiner`;
    refreshIcons();
  }
}

// Speak text using Web Speech API (Text-to-Speech)
function speakTextAloud(text) {
  if ('speechSynthesis' in window && text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function speakVivaQuestion() {
  speakTextAloud(currentVivaQuestion);
}

function speakVivaFeedback() {
  speakTextAloud(currentExaminerFeedback);
}

// Toggle Microphone (Speech-to-Text Voice Typing)
function toggleVoiceTyping() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  const micBtn = document.getElementById('btn-toggle-mic');
  const micText = document.getElementById('mic-status-text');

  if (isSpeechRecognitionActive) {
    if (speechRecognizer) speechRecognizer.stop();
    isSpeechRecognitionActive = false;
    micBtn.className = 'px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition';
    micText.innerText = 'Speak with Mic';
    return;
  }

  try {
    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = false;
    speechRecognizer.lang = 'en-US';

    speechRecognizer.onstart = () => {
      isSpeechRecognitionActive = true;
      micBtn.className = 'px-3.5 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-300 flex items-center gap-1.5 transition animate-pulse';
      micText.innerText = 'Listening... Speak now!';
    };

    speechRecognizer.onend = () => {
      isSpeechRecognitionActive = false;
      micBtn.className = 'px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition';
      micText.innerText = 'Speak with Mic';
    };

    speechRecognizer.onerror = () => {
      isSpeechRecognitionActive = false;
      micBtn.className = 'px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition';
      micText.innerText = 'Speak with Mic';
    };

    speechRecognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const textarea = document.getElementById('viva-answer-input');
      textarea.value = textarea.value ? `${textarea.value} ${transcript}` : transcript;
    };

    speechRecognizer.start();
  } catch (err) {
    console.error('Speech recognition error:', err);
    isSpeechRecognitionActive = false;
  }
}

// Submit Oral Answer
async function submitVivaAnswer() {
  const answer = document.getElementById('viva-answer-input').value.trim();
  const submitBtn = document.getElementById('btn-submit-viva');

  if (!answer) {
    alert('Please speak or type your oral answer before submitting.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Examiner is Evaluating...`;

  try {
    const res = await fetch(`${API_BASE}/api/interview/viva/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: currentVivaSubject,
        question: currentVivaQuestion,
        answer
      })
    });
    const data = await res.json();

    if (data.success && data.evaluation) {
      renderVivaEvaluation(data.evaluation);
    } else {
      alert(data.error || 'Evaluation failed.');
    }
  } catch (err) {
    alert('Error evaluating oral answer: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4 inline mr-1"></i> Submit Oral Answer to Examiner`;
    refreshIcons();
  }
}

// Render Viva Evaluation
function renderVivaEvaluation(evaluation) {
  const evalCard = document.getElementById('viva-evaluation-card');
  currentExaminerFeedback = evaluation.examinerFeedback;

  document.getElementById('viva-eval-score').innerText = evaluation.score;

  // Verdict badge
  const verdictBadge = document.getElementById('viva-eval-verdict');
  verdictBadge.innerText = evaluation.verdict || 'Satisfactory';
  if (evaluation.verdict === 'Excellent') {
    verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else if (evaluation.verdict === 'Satisfactory') {
    verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300';
  } else {
    verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300';
  }

  // Feedback
  document.getElementById('viva-eval-feedback').innerText = evaluation.examinerFeedback;

  // Follow-up question
  const followUpBox = document.getElementById('viva-followup-box');
  if (evaluation.followUpQuestion) {
    document.getElementById('viva-followup-text').innerText = evaluation.followUpQuestion;
    followUpBox.classList.remove('hidden');
  } else {
    followUpBox.classList.add('hidden');
  }

  evalCard.classList.remove('hidden');

  // Speak the feedback aloud
  speakTextAloud(evaluation.examinerFeedback);
  refreshIcons();
}

// Accept Follow-up Question to continue the viva!
function acceptFollowUpQuestion() {
  const followUpText = document.getElementById('viva-followup-text').innerText;
  if (!followUpText) return;

  currentVivaQuestion = followUpText;
  document.getElementById('viva-question-text').innerText = currentVivaQuestion;
  document.getElementById('viva-answer-input').value = '';
  document.getElementById('viva-evaluation-card').classList.add('hidden');

  speakTextAloud(currentVivaQuestion);
  refreshIcons();
}

// Reset Viva Session
function resetVivaSession() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  document.getElementById('viva-setup-card').classList.remove('hidden');
  document.getElementById('viva-active-card').classList.add('hidden');
  currentVivaQuestion = '';
  currentExaminerFeedback = '';
  refreshIcons();
}

// Toggle & Fetch Past Viva Records
async function toggleVivaHistory() {
  const container = document.getElementById('viva-history-container');
  const list = document.getElementById('viva-history-list');

  if (isVivaHistoryOpen) {
    container.classList.add('hidden');
    isVivaHistoryOpen = false;
    return;
  }

  container.classList.remove('hidden');
  isVivaHistoryOpen = true;
  list.innerHTML = `<p class="text-xs text-slate-500 py-3 text-center">Loading past viva records...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/interview/history/all`);
    const data = await res.json();

    if (data.success && data.history) {
      const vivaOnly = data.history.filter((h) => h.type === 'viva');
      if (vivaOnly.length > 0) {
        list.innerHTML = '';
        vivaOnly.forEach((item) => {
          const row = document.createElement('div');
          row.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm';
          row.innerHTML = `
            <div>
              <span class="font-semibold text-rose-700">${item.subject}</span>
              <span class="text-xs text-slate-500 ml-2">(${item.verdict || 'Verdict'})</span>
              <p class="text-xs text-slate-600 mt-1 line-clamp-1">${item.question || ''}</p>
            </div>
            <div class="text-right">
              <span class="text-base font-extrabold text-emerald-600">${item.score}/10</span>
              <p class="text-[10px] text-slate-400">${formatDateTime(item.savedAt)}</p>
            </div>
          `;
          list.appendChild(row);
        });
      } else {
        list.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past viva records saved yet.</p>`;
      }
    }
  } catch (err) {
    list.innerHTML = `<p class="text-xs text-rose-500 py-3 text-center">Error loading history: ${err.message}</p>`;
  }
}

// Clear Viva History
async function clearVivaHistoryData() {
  if (!confirm('Are you sure you want to clear all saved viva records?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/interview/history/clear`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      document.getElementById('viva-history-list').innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past viva records saved yet.</p>`;
    }
  } catch (err) {
    alert('Failed to clear viva history: ' + err.message);
  }
}
