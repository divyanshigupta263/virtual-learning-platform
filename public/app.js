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

// Health check function with automatic polling & visual status updates
async function checkServerHealth() {
  const statusText = document.getElementById('server-status-text');
  const badge = statusText ? statusText.parentElement : null;
  const dot = badge ? badge.querySelector('span:first-child') : null;

  try {
    const res = await fetch(`${API_BASE}/api/status`);
    if (res.ok) {
      if (statusText) statusText.innerText = 'AI Server Online';
      if (badge) badge.className = 'flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700';
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
      return true;
    }
  } catch (e) {
    if (statusText) statusText.innerText = 'Offline Mode (Ready to Practice)';
    if (badge) badge.className = 'flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700';
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-500';
  }
  return false;
}

// Auto-check server status every 4 seconds so it connects automatically when server starts
setInterval(checkServerHealth, 4000);

// =========================================================================
// OFFLINE CURATED DATA & RESILIENCE ENGINE (Works with zero server setup!)
// =========================================================================
const OFFLINE_TESTS = [
  {
    id: 'test-react-01',
    title: 'React.js Core & Hooks Mastery',
    subject: 'Web Development',
    difficulty: 'Intermediate',
    durationMinutes: 10,
    questions: [
      {
        id: 'q1',
        question: 'Which React hook is used to perform side effects like data fetching or DOM subscriptions?',
        options: ['useMemo', 'useEffect', 'useCallback', 'useContext'],
        correctOptionIndex: 1,
        explanation: 'useEffect is designed specifically for side effects like data fetching, manual DOM mutations, and timers.'
      },
      {
        id: 'q2',
        question: 'What is the primary benefit of React Virtual DOM?',
        options: [
          'It replaces HTML completely in the browser',
          'It minimizes direct browser DOM re-renders via efficient reconciliation',
          'It stores data permanently in localStorage',
          'It speeds up database queries on the server'
        ],
        correctOptionIndex: 1,
        explanation: 'Virtual DOM computes the diff in memory and only applies necessary updates to the actual browser DOM.'
      },
      {
        id: 'q3',
        question: 'Why should you never mutate state directly in React (e.g., state.count = 5)?',
        options: [
          'It throws a fatal syntax error in JavaScript',
          'React will not know the state changed and will not re-render the component',
          'It deletes the component from the DOM tree',
          'It clears browser cookies'
        ],
        correctOptionIndex: 1,
        explanation: 'React relies on immutability to detect state changes and schedule re-renders via setter functions.'
      },
      {
        id: 'q4',
        question: 'What is the purpose of keys when rendering lists of elements in React?',
        options: [
          'To encrypt the DOM elements for security',
          'To uniquely identify elements and optimize reconciliation during list updates',
          'To auto-sort list elements alphabetically',
          'To attach CSS animations automatically'
        ],
        correctOptionIndex: 1,
        explanation: 'Keys give elements a stable identity so React can determine which items were added, removed, or re-ordered.'
      }
    ]
  },
  {
    id: 'test-dsa-01',
    title: 'Data Structures: Trees & Algorithms',
    subject: 'Computer Science',
    difficulty: 'Intermediate',
    durationMinutes: 10,
    questions: [
      {
        id: 'q1',
        question: 'What is the worst-case time complexity of searching in a standard Binary Search Tree (BST)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctOptionIndex: 2,
        explanation: 'In the worst case (a skewed/unbalanced tree resembling a linked list), searching takes O(n) time.'
      },
      {
        id: 'q2',
        question: 'Which tree traversal visits the root node first, followed by left and right subtrees?',
        options: ['Inorder (Left, Root, Right)', 'Postorder (Left, Right, Root)', 'Preorder (Root, Left, Right)', 'Level-order'],
        correctOptionIndex: 2,
        explanation: 'Preorder traversal processes the current Root node before visiting its Left and Right children.'
      },
      {
        id: 'q3',
        question: 'Which data structure is fundamentally used to implement Breadth-First Search (BFS)?',
        options: ['Stack', 'Queue', 'Priority Queue', 'Disjoint Set'],
        correctOptionIndex: 1,
        explanation: 'BFS uses a Queue (FIFO) to explore nodes level-by-level in the correct order.'
      }
    ]
  }
];

function getOfflineInterviewQuestions(topic, count) {
  const map = {
    'React.js': [
      'Explain the difference between state and props in React, and when should you use each?',
      'How does the useEffect hook handle side effects and cleanup functions?',
      'What is the Virtual DOM and how does reconciliation optimize UI updates?'
    ],
    'Node.js & Express': [
      'How does the Node.js event loop handle asynchronous I/O operations non-blockingly?',
      'What is middleware in Express.js and how does next() pass control?',
      'Explain the difference between process.nextTick() and setImmediate().'
    ],
    'Python Programming': [
      'Explain the difference between list and tuple in Python with memory considerations.',
      'What are Python decorators and how do they work internally?',
      'How does Python manage memory through reference counting and garbage collection?'
    ],
    'Data Structures & Algorithms': [
      'What is the worst-case time complexity of searching in a standard Binary Search Tree vs AVL Tree?',
      'How does a hash table resolve key collisions, and what is its average vs worst-case time complexity?',
      'Explain the difference between BFS and DFS traversal with real-world use cases.'
    ],
    'MongoDB & Databases': [
      'What are the advantages of NoSQL document databases like MongoDB over traditional relational databases?',
      'Explain the purpose and mechanism of indexing in MongoDB collections.',
      'How does MongoDB handle data replication and high availability with replica sets?'
    ],
    'System Design & Cloud': [
      'What is the difference between horizontal and vertical scaling in distributed systems?',
      'Explain the CAP theorem and the trade-offs between Consistency, Availability, and Partition Tolerance.',
      'How does a load balancer distribute traffic across multiple backend application servers?'
    ]
  };
  const list = map[topic] || [
    `Explain the fundamental architectural principles of ${topic}.`,
    `What are the most effective performance optimization strategies in ${topic}?`,
    `How do you implement clean error handling and debugging in ${topic}?`
  ];
  return list.slice(0, count);
}

function evaluateOfflineInterview(topic, question, answer) {
  const words = (answer || '').trim().split(/\s+/).filter(Boolean).length;
  const score = Math.min(9.5, Math.max(6.0, Number((6.0 + (words / 15)).toFixed(1))));
  const evalResult = {
    score,
    correctness: score >= 8.0 ? 'Fully Correct' : 'Partially Correct',
    feedback: `Good technical attempt on ${topic}. You covered core fundamental points clearly. To achieve a top score in a formal interview, include production scalability and error handling details.`,
    missingPoints: [
      'Concrete architectural examples',
      'Edge case and error boundary considerations'
    ],
    improvementSuggestions: 'Review official documentation and practice explaining technical concepts concisely with clear time constraints.'
  };

  saveToLocalHistory('interview', {
    topic,
    question,
    answer,
    score,
    type: 'mock_interview',
    correctness: evalResult.correctness,
    savedAt: new Date().toISOString()
  });

  return evalResult;
}

function saveToLocalHistory(type, record) {
  try {
    const key = `history_${type}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(record);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 30)));
  } catch (e) {
    console.warn('LocalStorage save notice:', e);
  }
}

function getLocalHistory(type) {
  try {
    return JSON.parse(localStorage.getItem(`history_${type}`) || '[]');
  } catch {
    return [];
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
let interviewCandidateAnswers = {};
let interviewEvaluations = {};

// Start Interview Simulation (Online AI + Automatic Offline Question Bank)
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

  interviewCandidateAnswers = {};
  interviewEvaluations = {};

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

      document.getElementById('interview-setup-card').classList.add('hidden');
      document.getElementById('interview-active-card').classList.remove('hidden');
      displayCurrentInterviewQuestion();
      return;
    }
  } catch (err) {
    console.warn('Backend interview notice, using offline curated questions:', err.message);
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = `<i data-lucide="bot" class="w-4 h-4 inline mr-1"></i> Start Interview Simulation`;
    refreshIcons();
  }

  // Graceful offline fallback
  interviewQuestions = getOfflineInterviewQuestions(interviewTopic, Number(questionCount) || 3);
  interviewCurrentIndex = 0;
  document.getElementById('interview-setup-card').classList.add('hidden');
  document.getElementById('interview-active-card').classList.remove('hidden');
  displayCurrentInterviewQuestion();
}

// Render navigation pills for Interview Questions (e.g. Q1, Q2, Q3)
function renderInterviewNavPills() {
  const navContainer = document.getElementById('interview-question-nav');
  if (!navContainer) return;
  navContainer.innerHTML = '';

  interviewQuestions.forEach((_, idx) => {
    const isCurrent = idx === interviewCurrentIndex;
    const isEvaluated = !!interviewEvaluations[idx];
    const isDrafted = !!(interviewCandidateAnswers[idx] && interviewCandidateAnswers[idx].trim());

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.onclick = () => jumpToInterviewQuestion(idx);

    if (isCurrent) {
      pill.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs transition';
    } else if (isEvaluated) {
      pill.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition';
    } else if (isDrafted) {
      pill.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition';
    } else {
      pill.className = 'px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition';
    }

    pill.innerHTML = `Q${idx + 1}${isEvaluated ? ' <span class="text-xs">✓</span>' : ''}`;
    navContainer.appendChild(pill);
  });
}

// Display Question at Current Index with full restoration
function displayCurrentInterviewQuestion() {
  if (!interviewQuestions || interviewQuestions.length === 0) return;

  document.getElementById('interview-progress-badge').innerText = `Question ${interviewCurrentIndex + 1} of ${interviewQuestions.length}`;
  document.getElementById('interview-active-topic').innerText = interviewTopic;
  document.getElementById('interview-question-text').innerText = interviewQuestions[interviewCurrentIndex];

  renderInterviewNavPills();

  const answerInput = document.getElementById('interview-answer-input');
  const actionButtons = document.getElementById('interview-action-buttons');
  const submitBtn = document.getElementById('btn-submit-answer');
  const skipBtn = document.getElementById('btn-skip-interview');
  const evalCard = document.getElementById('interview-evaluation-card');

  const currentEval = interviewEvaluations[interviewCurrentIndex];

  if (currentEval) {
    // Already evaluated: show saved answer, lock textarea, display evaluation
    answerInput.value = interviewCandidateAnswers[interviewCurrentIndex] || '';
    answerInput.disabled = true;
    if (actionButtons) actionButtons.classList.add('hidden');
    renderInterviewEvaluation(currentEval, false);
  } else {
    // Un-evaluated: restore draft if any, enable textarea, show submit and next buttons
    answerInput.value = interviewCandidateAnswers[interviewCurrentIndex] || '';
    answerInput.disabled = false;
    if (actionButtons) actionButtons.classList.remove('hidden');
    if (submitBtn) {
      submitBtn.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4 inline mr-1"></i> Submit This Question Answer`;
    }
    if (skipBtn) {
      if (interviewCurrentIndex + 1 < interviewQuestions.length) {
        skipBtn.innerHTML = `<span>Next Question</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
      } else {
        skipBtn.innerHTML = `<span>First Question</span> <i data-lucide="rotate-ccw" class="w-4 h-4"></i>`;
      }
    }
    if (evalCard) evalCard.classList.add('hidden');
  }

  refreshIcons();
}

// Jump directly to an interview question
function jumpToInterviewQuestion(idx) {
  if (idx < 0 || idx >= interviewQuestions.length) return;
  const answerInput = document.getElementById('interview-answer-input');
  if (answerInput && !interviewEvaluations[interviewCurrentIndex]) {
    interviewCandidateAnswers[interviewCurrentIndex] = answerInput.value;
  }
  interviewCurrentIndex = idx;
  displayCurrentInterviewQuestion();
}

// Skip or navigate to next interview question without evaluating
function skipInterviewQuestion() {
  const answerInput = document.getElementById('interview-answer-input');
  if (answerInput && !interviewEvaluations[interviewCurrentIndex]) {
    interviewCandidateAnswers[interviewCurrentIndex] = answerInput.value;
  }
  if (interviewCurrentIndex + 1 < interviewQuestions.length) {
    interviewCurrentIndex++;
  } else {
    interviewCurrentIndex = 0;
  }
  displayCurrentInterviewQuestion();
}

// Re-attempt / Edit an evaluated answer
function editInterviewAnswer() {
  delete interviewEvaluations[interviewCurrentIndex];
  const evalCard = document.getElementById('interview-evaluation-card');
  if (evalCard) evalCard.classList.add('hidden');

  const answerInput = document.getElementById('interview-answer-input');
  answerInput.disabled = false;
  answerInput.focus();

  const actionButtons = document.getElementById('interview-action-buttons');
  if (actionButtons) actionButtons.classList.remove('hidden');

  const submitBtn = document.getElementById('btn-submit-answer');
  if (submitBtn) {
    submitBtn.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4 inline mr-1"></i> Re-submit This Answer`;
  }

  renderInterviewNavPills();
  refreshIcons();
}

// Submit Answer for AI Evaluation (Online Gemini + Automatic Offline Evaluation)
async function submitInterviewAnswer() {
  const answerInput = document.getElementById('interview-answer-input');
  const answer = answerInput.value.trim();
  const submitBtn = document.getElementById('btn-submit-answer');

  if (!answer) {
    alert('Please type your answer before submitting.');
    return;
  }

  interviewCandidateAnswers[interviewCurrentIndex] = answer;

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
      interviewEvaluations[interviewCurrentIndex] = data.evaluation;
      renderInterviewEvaluation(data.evaluation, true);
      renderInterviewNavPills();
      return;
    }
  } catch (err) {
    console.warn('Backend evaluation notice, using offline evaluator:', err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4 inline mr-1"></i> Submit This Question Answer`;
    refreshIcons();
  }

  // Graceful offline evaluation
  const offlineEval = evaluateOfflineInterview(interviewTopic, interviewQuestions[interviewCurrentIndex], answer);
  interviewEvaluations[interviewCurrentIndex] = offlineEval;
  renderInterviewEvaluation(offlineEval, true);
  renderInterviewNavPills();
}

// Render Evaluation Score & Feedback
function renderInterviewEvaluation(evaluation, shouldScroll = true) {
  const evalCard = document.getElementById('interview-evaluation-card');
  const actionButtons = document.getElementById('interview-action-buttons');
  const answerInput = document.getElementById('interview-answer-input');

  // Lock answer input and hide normal submission button
  answerInput.disabled = true;
  if (actionButtons) actionButtons.classList.add('hidden');

  // Score (Strictly out of 10)
  const numScore = Number(evaluation.score);
  const scoreOutOf10 = numScore > 10 ? Number((numScore / 10).toFixed(1)) : numScore;
  document.getElementById('eval-score').innerText = scoreOutOf10;

  // Correctness badge (Thresholds based on 10)
  const correctnessBadge = document.getElementById('eval-correctness');
  correctnessBadge.innerText = evaluation.correctness || (scoreOutOf10 >= 8 ? 'Fully Correct' : scoreOutOf10 >= 5 ? 'Partially Correct' : 'Needs Practice');
  if (scoreOutOf10 >= 8.0) {
    correctnessBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else if (scoreOutOf10 >= 5.0) {
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
    li.innerText = 'No major technical points missed!';
    missingList.appendChild(li);
  }

  // Update Next Button text
  const nextBtn = document.getElementById('btn-next-question');
  const allEvaluated = interviewQuestions.every((_, idx) => !!interviewEvaluations[idx]);

  if (interviewCurrentIndex + 1 < interviewQuestions.length) {
    nextBtn.innerHTML = `<span>Next Question (${interviewCurrentIndex + 2}/${interviewQuestions.length})</span> <i data-lucide="arrow-right" class="w-4 h-4 inline"></i>`;
  } else if (!allEvaluated) {
    nextBtn.innerHTML = `<span>Review Unfinished Questions</span> <i data-lucide="rotate-ccw" class="w-4 h-4 inline"></i>`;
  } else {
    nextBtn.innerHTML = `<span>Finish Session</span> <i data-lucide="check-circle-2" class="w-4 h-4 inline"></i>`;
  }

  evalCard.classList.remove('hidden');
  if (shouldScroll) {
    evalCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  refreshIcons();
}

// Next Question Handler
function nextInterviewQuestion() {
  if (interviewCurrentIndex + 1 < interviewQuestions.length) {
    interviewCurrentIndex++;
    displayCurrentInterviewQuestion();
  } else {
    const allEvaluated = interviewQuestions.every((_, idx) => !!interviewEvaluations[idx]);
    if (allEvaluated) {
      alert('Congratulations! You completed all questions in this interview simulation.');
      resetInterviewSession();
    } else {
      const nextUnfinished = interviewQuestions.findIndex((_, idx) => !interviewEvaluations[idx]);
      if (nextUnfinished !== -1) {
        interviewCurrentIndex = nextUnfinished;
        displayCurrentInterviewQuestion();
      } else {
        alert('Congratulations! You completed this interview simulation session.');
        resetInterviewSession();
      }
    }
  }
}

// Reset Session
function resetInterviewSession() {
  document.getElementById('interview-setup-card').classList.remove('hidden');
  document.getElementById('interview-active-card').classList.add('hidden');
  interviewQuestions = [];
  interviewCurrentIndex = 0;
  interviewCandidateAnswers = {};
  interviewEvaluations = {};
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

  let records = [];
  try {
    const res = await fetch(`${API_BASE}/api/interview/history/all`);
    const data = await res.json();
    if (data.success && data.history && data.history.length > 0) {
      records = data.history;
    }
  } catch (err) {
    console.warn('Backend history notice, using local history:', err.message);
  }

  // Merge with any local attempts
  const local = getLocalHistory('interview');
  const allRecords = [...records, ...local.filter((l) => !records.some((r) => r.question === l.question && r.answer === l.answer))];

  if (allRecords.length > 0) {
    list.innerHTML = '';
    allRecords.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm';
      
      const rawScore = Number(item.score);
      const scoreOutOf10 = rawScore > 10 ? Number((rawScore / 10).toFixed(1)) : rawScore;
      const displayScore = `${scoreOutOf10}/10`;

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
let activeTestQuestionIndex = 0;
let testTimerInterval = null;
let testSecondsRemaining = 0;
let isTestHistoryOpen = false;

// Render Test Cards Grid
function renderTestCatalogCards(tests) {
  const grid = document.getElementById('test-catalog-grid');
  if (!grid) return;
  grid.innerHTML = '';
  tests.forEach((test) => {
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
          <i data-lucide="clock" class="w-3.5 h-3.5 text-violet-600"></i> ${test.durationMinutes || 10} Minutes • ${test.totalQuestions || (test.questions ? test.questions.length : 3)} Questions (Marks out of 10)
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

// Fetch Available Test Catalog (Online + Offline Resilience)
async function loadTestCatalog() {
  const grid = document.getElementById('test-catalog-grid');
  grid.innerHTML = `<p class="text-xs text-slate-500 col-span-2 py-4 text-center">Loading practice tests...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/test`);
    const data = await res.json();

    if (data.success && data.tests && data.tests.length > 0) {
      renderTestCatalogCards(data.tests);
      return;
    }
  } catch (err) {
    console.warn('Backend catalog notice, loading local test catalog:', err.message);
  }

  // Fallback to local catalog
  renderTestCatalogCards(OFFLINE_TESTS);
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
      return;
    }
  } catch (err) {
    console.warn('Backend AI quiz notice, launching offline practice test:', err.message);
  } finally {
    genBtn.disabled = false;
    genBtn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 inline mr-1"></i> Generate & Start`;
    refreshIcons();
  }

  // Fallback to local test if AI test endpoint is unreachable
  launchTestRunner(OFFLINE_TESTS[0]);
}

// Start a Test by ID (Online + Offline Fallback)
async function startTest(testId) {
  try {
    const res = await fetch(`${API_BASE}/api/test/${testId}`);
    const data = await res.json();

    if (data.success && data.test) {
      launchTestRunner(data.test);
      return;
    }
  } catch (err) {
    console.warn('Backend startTest notice, using local test questions:', err.message);
  }

  const localTest = OFFLINE_TESTS.find((t) => t.id === testId);
  if (localTest) {
    launchTestRunner(localTest);
  } else {
    alert('Test not found.');
  }
}

// Launch the Active Test Runner
function launchTestRunner(test) {
  currentActiveTest = test;
  currentTestAnswers = {};
  activeTestQuestionIndex = 0;

  // Switch views
  document.getElementById('test-catalog-container').classList.add('hidden');
  document.getElementById('test-runner-container').classList.remove('hidden');
  document.getElementById('test-result-summary').classList.add('hidden');
  document.getElementById('runner-single-question-box').classList.remove('hidden');
  document.getElementById('runner-action-bar').classList.remove('hidden');

  // Set titles
  document.getElementById('runner-test-title').innerText = test.title;
  document.getElementById('runner-test-subject').innerText = `${test.subject || 'Assessment'} • ${test.questions.length} Questions (Marks out of 10)`;

  // Render first question
  renderCurrentTestQuestion();

  // Start Countdown Timer
  startTestTimer(test.durationMinutes || 10);
  refreshIcons();
}

// Render Single Active Question with stepper & navigation pills
function renderCurrentTestQuestion() {
  if (!currentActiveTest || !currentActiveTest.questions || currentActiveTest.questions.length === 0) return;

  const questions = currentActiveTest.questions;
  const total = questions.length;
  if (activeTestQuestionIndex >= total) activeTestQuestionIndex = total - 1;
  if (activeTestQuestionIndex < 0) activeTestQuestionIndex = 0;

  const q = questions[activeTestQuestionIndex];
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 1. Render Question Navigation Pills (e.g. Q1, Q2, Q3)
  const navContainer = document.getElementById('test-question-nav-pills');
  if (navContainer) {
    navContainer.innerHTML = '';
    questions.forEach((item, idx) => {
      const isAnswered = currentTestAnswers[item.id] !== undefined && currentTestAnswers[item.id] !== null;
      const isActive = idx === activeTestQuestionIndex;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.onclick = () => jumpToTestQuestion(idx);

      if (isActive) {
        pill.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-violet-600 text-white shadow-sm flex items-center gap-1 transition';
      } else if (isAnswered) {
        pill.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 flex items-center gap-1 transition';
      } else {
        pill.className = 'px-3 py-1.5 rounded-xl font-semibold text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 flex items-center gap-1 transition';
      }
      pill.innerHTML = `Q${idx + 1}${isAnswered ? ' <span class="text-xs font-black text-emerald-600">✓</span>' : ''}`;
      navContainer.appendChild(pill);
    });
  }

  // 2. Render Answered Progress Counter
  const answeredCount = Object.keys(currentTestAnswers).length;
  const countBadge = document.getElementById('runner-answered-count');
  if (countBadge) {
    countBadge.innerText = `${answeredCount} of ${total} Questions Answered`;
    if (answeredCount === total) {
      countBadge.className = 'text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200';
    } else {
      countBadge.className = 'text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200';
    }
  }

  // 3. Update Stepper Buttons (Prev / Next)
  const btnPrev = document.getElementById('btn-prev-test-q');
  if (btnPrev) {
    btnPrev.disabled = activeTestQuestionIndex === 0;
  }
  const btnNext = document.getElementById('btn-next-test-q');
  if (btnNext) {
    if (activeTestQuestionIndex === total - 1) {
      btnNext.innerHTML = `<span>Review First Question</span> <i data-lucide="rotate-ccw" class="w-4 h-4"></i>`;
    } else {
      btnNext.innerHTML = `<span>Next Question</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
    }
  }

  // 4. Render Current Single Question & Options
  const qBox = document.getElementById('runner-single-question-box');
  if (qBox) {
    let optionsHtml = '';
    const selectedOption = currentTestAnswers[q.id];

    q.options.forEach((opt, optIdx) => {
      const letter = LETTERS[optIdx] || (optIdx + 1);
      const isSelected = selectedOption === optIdx;
      const safeOptText = String(opt)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      optionsHtml += `
        <button type="button" onclick="selectQuizOption('${q.id}', ${optIdx})" class="quiz-option-btn group ${isSelected ? 'selected' : ''}">
          <div class="flex items-center gap-3">
            <span class="w-7 h-7 rounded-lg ${isSelected ? 'bg-violet-600 text-white font-bold' : 'bg-slate-100 text-slate-700 font-bold group-hover:bg-violet-100 group-hover:text-violet-700'} text-xs flex items-center justify-center border border-slate-200 transition shadow-xs">
              ${letter}
            </span>
            <span class="text-slate-800 text-sm font-medium leading-relaxed">${safeOptText}</span>
          </div>
          <span class="flex items-center">
            ${isSelected ? '<span class="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">✓</span>' : ''}
          </span>
        </button>
      `;
    });

    qBox.innerHTML = `
      <div class="p-6 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <span class="px-3 py-1 bg-violet-100 text-violet-800 rounded-lg text-xs font-bold uppercase tracking-wider">
            Question ${activeTestQuestionIndex + 1} of ${total}
          </span>
          <span class="text-xs font-semibold text-slate-500">Pick an answer (you can change it anytime)</span>
        </div>
        <p class="font-bold text-slate-900 text-base leading-relaxed">
          ${q.question}
        </p>
        <div class="space-y-3 pt-1">
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  refreshIcons();
}

// Option Click Handler - Saves answer without premature evaluation
function selectQuizOption(questionId, optionIndex) {
  // Save answer in answers map
  currentTestAnswers[questionId] = optionIndex;
  // Re-render single question box & pills to reflect selection
  renderCurrentTestQuestion();
}

// Stepper Prev / Next question navigation
function navigateTestQuestion(delta) {
  if (!currentActiveTest || !currentActiveTest.questions) return;
  const total = currentActiveTest.questions.length;
  if (delta === 1 && activeTestQuestionIndex === total - 1) {
    activeTestQuestionIndex = 0; // loop to first question for review
  } else {
    const target = activeTestQuestionIndex + delta;
    if (target >= 0 && target < total) {
      activeTestQuestionIndex = target;
    }
  }
  renderCurrentTestQuestion();
}

// Jump directly to any question by clicking its pill
function jumpToTestQuestion(idx) {
  if (!currentActiveTest || !currentActiveTest.questions) return;
  const total = currentActiveTest.questions.length;
  if (idx >= 0 && idx < total) {
    activeTestQuestionIndex = idx;
    renderCurrentTestQuestion();
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


// Offline grading engine
function gradeOfflineTest(test, answers) {
  let correctCount = 0;
  const breakdown = [];

  test.questions.forEach((q) => {
    const selectedOptionIndex = answers[q.id];
    const isAnswered = selectedOptionIndex !== undefined && selectedOptionIndex !== null;
    const isCorrect = isAnswered && selectedOptionIndex === q.correctOptionIndex;
    if (isCorrect) correctCount++;

    breakdown.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedOptionIndex: isAnswered ? selectedOptionIndex : null,
      selectedOptionText: isAnswered ? q.options[selectedOptionIndex] : 'Not Answered',
      correctOptionIndex: q.correctOptionIndex,
      correctOptionText: q.options[q.correctOptionIndex],
      isCorrect,
      explanation: q.explanation || 'Refer to documentation for this concept.'
    });
  });

  const totalQuestions = test.questions.length;
  const scoreOutOf10 = Number(((correctCount / totalQuestions) * 10).toFixed(1));
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scoreOutOf10 >= 6.0;

  saveToLocalHistory('test', {
    testTitle: test.title,
    correctCount,
    totalQuestions,
    scoreOutOf10,
    scorePercentage,
    passed,
    grade: scoreOutOf10 >= 8.5 ? 'A' : scoreOutOf10 >= 7.0 ? 'B' : scoreOutOf10 >= 6.0 ? 'C' : 'F',
    savedAt: new Date().toISOString()
  });

  return {
    success: true,
    testId: test.id,
    testTitle: test.title,
    summary: {
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      scoreOutOf10,
      scorePercentage,
      passed,
      grade: scoreOutOf10 >= 8.5 ? 'A' : scoreOutOf10 >= 7.0 ? 'B' : scoreOutOf10 >= 6.0 ? 'C' : 'F'
    },
    breakdown
  };
}

// Submit Test Answers for Auto-Grading (with validation & offline grading)
async function submitTestAnswers() {
  if (!currentActiveTest) return;

  const total = currentActiveTest.questions.length;
  const answered = Object.keys(currentTestAnswers).length;

  if (answered < total) {
    const proceed = confirm(`You have answered ${answered} out of ${total} questions. Do you want to submit now?`);
    if (!proceed) return;
  }

  if (testTimerInterval) clearInterval(testTimerInterval);

  const submitBtn = document.getElementById('btn-submit-test');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Scoring Your Answers...`;

  try {
    const res = await fetch(`${API_BASE}/api/test/${currentActiveTest.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: currentTestAnswers })
    });
    const data = await res.json();

    if (data.success) {
      renderTestResults(data);
      return;
    }
  } catch (err) {
    console.warn('Backend test submit notice, grading offline:', err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 inline mr-1"></i> Submit Test for Scoring`;
    refreshIcons();
  }

  // Graceful offline grading
  const offlineResult = gradeOfflineTest(currentActiveTest, currentTestAnswers);
  renderTestResults(offlineResult);
}

// Render Results & Scorecard strictly out of 10
function renderTestResults(data) {
  document.getElementById('runner-action-bar').classList.add('hidden');
  document.getElementById('runner-single-question-box').classList.add('hidden');
  const summaryCard = document.getElementById('test-result-summary');

  // Strictly calculate and display score out of 10
  const scoreOutOf10 = data.summary.scoreOutOf10 !== undefined 
    ? data.summary.scoreOutOf10 
    : Number(((data.summary.correctCount / data.summary.totalQuestions) * 10).toFixed(1));

  document.getElementById('test-stat-score').innerText = `${scoreOutOf10} / 10`;
  const statCorrect = document.getElementById('test-stat-correct');
  if (statCorrect) {
    statCorrect.innerText = `${data.summary.correctCount} / ${data.summary.totalQuestions}`;
  }
  document.getElementById('test-stat-grade').innerText = data.summary.grade;

  // Passed / Failed Badge (Threshold 6/10)
  const passBadge = document.getElementById('test-passed-badge');
  if (data.summary.passed) {
    passBadge.innerText = 'PASSED';
    passBadge.className = 'px-4 py-1.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else {
    passBadge.innerText = 'NEEDS IMPROVEMENT';
    passBadge.className = 'px-4 py-1.5 rounded-full font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300';
  }

  // Populate detailed question-by-question review in #runner-review-items
  const reviewContainer = document.getElementById('runner-review-items');
  if (reviewContainer && data.breakdown) {
    reviewContainer.innerHTML = '';
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

    data.breakdown.forEach((item, idx) => {
      const reviewBox = document.createElement('div');
      reviewBox.className = 'p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs';

      let optionsHtml = '';
      item.options.forEach((opt, optIdx) => {
        const letter = LETTERS[optIdx] || (optIdx + 1);
        const isCorrect = optIdx === item.correctOptionIndex;
        const isStudentChoice = optIdx === item.selectedOptionIndex;

        let optStyle = 'border-slate-200 bg-slate-50 text-slate-700';
        let badgeStyle = 'bg-slate-200 text-slate-700';
        let tagHtml = '';

        if (isCorrect) {
          optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
          badgeStyle = 'bg-emerald-600 text-white';
          tagHtml = '<span class="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold">Correct Answer ✓</span>';
        } else if (isStudentChoice && !isCorrect) {
          optStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-300';
          badgeStyle = 'bg-rose-600 text-white';
          tagHtml = '<span class="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-xs font-bold">Your Choice ✗</span>';
        }

        optionsHtml += `
          <div class="flex items-center justify-between p-3 rounded-xl border ${optStyle} text-sm">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-md ${badgeStyle} text-xs font-bold flex items-center justify-center">${letter}</span>
              <span>${opt}</span>
            </div>
            ${tagHtml}
          </div>
        `;
      });

      reviewBox.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <h5 class="font-bold text-slate-900 text-sm">
            <span class="text-violet-600 font-black mr-1">Q${idx + 1}.</span> ${item.question}
          </h5>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${item.isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
          </span>
        </div>
        <div class="space-y-2 pt-1">
          ${optionsHtml}
        </div>
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <strong class="text-slate-900">Explanation:</strong> ${item.explanation}
        </div>
      `;
      reviewContainer.appendChild(reviewBox);
    });
  }

  summaryCard.classList.remove('hidden');
  summaryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  refreshIcons();
}

// Exit Test Runner
function exitTestRunner() {
  if (testTimerInterval) clearInterval(testTimerInterval);
  document.getElementById('test-runner-container').classList.add('hidden');
  document.getElementById('test-catalog-container').classList.remove('hidden');
  currentActiveTest = null;
  currentTestAnswers = {};
  activeTestQuestionIndex = 0;
  loadTestCatalog();
  refreshIcons();
}

// Toggle & Fetch Past Test History (Strictly /10)
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

  let records = [];
  try {
    const res = await fetch(`${API_BASE}/api/test/history/all`);
    const data = await res.json();
    if (data.success && data.history && data.history.length > 0) {
      records = data.history;
    }
  } catch (err) {
    console.warn('Backend test history notice, using local records:', err.message);
  }

  const local = getLocalHistory('test');
  const allRecords = [...records, ...local.filter((l) => !records.some((r) => r.testTitle === l.testTitle && r.savedAt === l.savedAt))];

  if (allRecords.length > 0) {
    list.innerHTML = '';
    allRecords.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm';
      
      const rawScore = item.scoreOutOf10 !== undefined 
        ? item.scoreOutOf10 
        : Number(((item.correctCount / item.totalQuestions) * 10).toFixed(1));

      row.innerHTML = `
        <div>
          <span class="font-semibold text-violet-700">${item.testTitle}</span>
          <p class="text-xs text-slate-500 mt-0.5">
            ${item.correctCount}/${item.totalQuestions} questions correct • Grade ${item.grade}
          </p>
        </div>
        <div class="text-right">
          <span class="text-base font-extrabold ${item.passed ? 'text-emerald-600' : 'text-rose-600'}">
            ${rawScore}/10
          </span>
          <p class="text-[10px] text-slate-400">${formatDateTime(item.savedAt)}</p>
        </div>
      `;
      list.appendChild(row);
    });
  } else {
    list.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past test records saved yet.</p>`;
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

function getOfflineVivaQuestion(subject) {
  const map = {
    'Database Management Systems (DBMS)': 'What is the purpose of Database Normalization and how does 3NF eliminate transitive dependency?',
    'Operating Systems': 'Explain the difference between a Process and a Thread, and how does the OS perform Context Switching?',
    'Computer Networks': 'Explain the 7 layers of the OSI model and the difference between TCP and UDP transport protocols.',
    'Software Engineering': 'What is the difference between Agile Methodology and the Waterfall Model in software development life cycles?'
  };
  return map[subject] || `Explain the core foundational concepts and real-world applications of ${subject}.`;
}

function evaluateOfflineViva(subject, question, answer) {
  const words = (answer || '').trim().split(/\s+/).filter(Boolean).length;
  const score = Math.min(9.5, Math.max(6.0, Number((6.0 + (words / 12)).toFixed(1))));
  const verdict = score >= 8.0 ? 'Excellent' : 'Satisfactory';
  const evalResult = {
    score,
    verdict,
    examinerFeedback: `Well articulated oral response for ${subject}. You demonstrated solid foundational understanding of the core concept.`,
    followUpQuestion: `Can you give a practical example where this principle is applied in real-world software architecture?`
  };

  saveToLocalHistory('interview', {
    subject,
    question,
    answer,
    score,
    type: 'viva',
    verdict,
    savedAt: new Date().toISOString()
  });

  return evalResult;
}

function showVivaActiveQuestion() {
  document.getElementById('viva-setup-card').classList.add('hidden');
  document.getElementById('viva-active-card').classList.remove('hidden');
  document.getElementById('viva-evaluation-card').classList.add('hidden');

  document.getElementById('viva-active-subject').innerText = currentVivaSubject;
  document.getElementById('viva-question-text').innerText = currentVivaQuestion;
  document.getElementById('viva-answer-input').value = '';

  // Automatically speak the examiner question aloud!
  speakTextAloud(currentVivaQuestion);
}

// Start Viva Session (Online + Offline Resilience)
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
      showVivaActiveQuestion();
      return;
    }
  } catch (err) {
    console.warn('Backend viva notice, using offline viva question:', err.message);
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = `<i data-lucide="mic" class="w-4 h-4 inline mr-1"></i> Enter Viva Room & Ask Examiner`;
    refreshIcons();
  }

  // Graceful offline fallback
  currentVivaQuestion = getOfflineVivaQuestion(currentVivaSubject);
  showVivaActiveQuestion();
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

// Submit Oral Answer (Online + Offline Resilience)
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
      return;
    }
  } catch (err) {
    console.warn('Backend viva evaluation notice, evaluating offline:', err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4 inline mr-1"></i> Submit Oral Answer to Examiner`;
    refreshIcons();
  }

  // Graceful offline evaluation
  const offlineViva = evaluateOfflineViva(currentVivaSubject, currentVivaQuestion, answer);
  renderVivaEvaluation(offlineViva);
}

// Render Viva Evaluation
function renderVivaEvaluation(evaluation) {
  const evalCard = document.getElementById('viva-evaluation-card');
  currentExaminerFeedback = evaluation.examinerFeedback;

  const numScore = Number(evaluation.score);
  const scoreOutOf10 = numScore > 10 ? Number((numScore / 10).toFixed(1)) : numScore;
  document.getElementById('viva-eval-score').innerText = scoreOutOf10;

  // Verdict badge
  const verdictBadge = document.getElementById('viva-eval-verdict');
  verdictBadge.innerText = evaluation.verdict || (scoreOutOf10 >= 8 ? 'Excellent' : scoreOutOf10 >= 5 ? 'Satisfactory' : 'Needs Revision');
  if (evaluation.verdict === 'Excellent' || scoreOutOf10 >= 8) {
    verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else if (evaluation.verdict === 'Satisfactory' || scoreOutOf10 >= 5) {
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
  evalCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

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

  let records = [];
  try {
    const res = await fetch(`${API_BASE}/api/interview/history/all`);
    const data = await res.json();
    if (data.success && data.history) {
      records = data.history.filter((h) => h.type === 'viva');
    }
  } catch (err) {
    console.warn('Backend viva history notice, using local records:', err.message);
  }

  const local = getLocalHistory('interview').filter((h) => h.type === 'viva');
  const allRecords = [...records, ...local.filter((l) => !records.some((r) => r.question === l.question && r.savedAt === l.savedAt))];

  if (allRecords.length > 0) {
    list.innerHTML = '';
    allRecords.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm';
      
      const rawScore = Number(item.score);
      const scoreOutOf10 = rawScore > 10 ? Number((rawScore / 10).toFixed(1)) : rawScore;

      row.innerHTML = `
        <div>
          <span class="font-semibold text-rose-700">${item.subject}</span>
          <span class="text-xs text-slate-500 ml-2">(${item.verdict || 'Verdict'})</span>
          <p class="text-xs text-slate-600 mt-1 line-clamp-1">${item.question || ''}</p>
        </div>
        <div class="text-right">
          <span class="text-base font-extrabold text-emerald-600">${scoreOutOf10}/10</span>
          <p class="text-[10px] text-slate-400">${formatDateTime(item.savedAt)}</p>
        </div>
      `;
      list.appendChild(row);
    });
  } else {
    list.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No past viva records saved yet.</p>`;
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
