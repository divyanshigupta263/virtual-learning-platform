import express from 'express';
import { saveTestResult, getDB, getTestHistory, clearTestHistory } from '../db.js';
import { generateContentWithFallback } from './interview.js';

const router = express.Router();

// Mock Test Database (Catalog with questions and answer keys)
const MOCK_TESTS = [
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

/**
 * GET /api/test
 * Returns the catalog of all available mock tests without questions
 */
router.get('/', (req, res) => {
  const catalog = MOCK_TESTS.map(({ id, title, subject, difficulty, durationMinutes, questions }) => ({
    id,
    title,
    subject,
    difficulty,
    durationMinutes,
    totalQuestions: questions.length
  }));

  res.json({
    success: true,
    tests: catalog
  });
});

/**
 * GET /api/test/:id
 * Returns a specific test with questions and options (hiding correctOptionIndex for anti-cheat)
 */
router.get('/:id', (req, res) => {
  const test = MOCK_TESTS.find((t) => t.id === req.params.id);

  if (!test) {
    return res.status(404).json({ success: false, error: 'Test not found' });
  }

  // Sanitize questions by stripping correctOptionIndex and explanation
  const sanitizedQuestions = test.questions.map(({ id, question, options }) => ({
    id,
    question,
    options
  }));

  res.json({
    success: true,
    test: {
      id: test.id,
      title: test.title,
      subject: test.subject,
      difficulty: test.difficulty,
      durationMinutes: test.durationMinutes,
      questions: sanitizedQuestions
    }
  });
});

/**
 * POST /api/test/:id/submit
 * Evaluates student submission, calculates score, and returns detailed performance review
 */
router.post('/:id/submit', async (req, res) => {
  const test = MOCK_TESTS.find((t) => t.id === req.params.id);

  if (!test) {
    return res.status(404).json({ success: false, error: 'Test not found' });
  }

  const { answers = {} } = req.body; // format: { q1: 1, q2: 0, ... }

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
      explanation: q.explanation
    });
  });

  const totalQuestions = test.questions.length;
  const scoreOutOf10 = Number(((correctCount / totalQuestions) * 10).toFixed(1));
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scoreOutOf10 >= 6.0; // 6/10 passing threshold

  // Automatically save result to database
  await saveTestResult({
    testId: test.id,
    testTitle: test.title,
    totalQuestions,
    correctCount,
    scoreOutOf10,
    scorePercentage,
    passed,
    grade: scoreOutOf10 >= 8.5 ? 'A' : scoreOutOf10 >= 7.0 ? 'B' : scoreOutOf10 >= 6.0 ? 'C' : 'F'
  });

  res.json({
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
  });
});
/**
 * GET /api/test/history/all
 * Retrieves all saved student test results from MongoDB Atlas
 */
router.get('/history/all', async (req, res) => {
  try {
    const history = await getTestHistory();
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST or DELETE /api/test/history/clear
 * Clears all past test history
 */
router.all('/history/clear', async (req, res) => {
  try {
    await clearTestHistory();
    res.json({ success: true, message: 'Test history cleared successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/test/generate-ai-test
 * Google Gemini dynamically generates a timed Multiple-Choice Quiz on any topic!
 */
router.post('/generate-ai-test', async (req, res) => {
  try {
    const { topic = 'Python Programming', difficulty = 'Intermediate', questionCount = 3 } = req.body;

    const prompt = `You are an expert technical examiner creating a timed multiple-choice quiz on "${topic}" at "${difficulty}" difficulty.
Generate ${questionCount} high-quality technical multiple-choice questions.
Return raw JSON strictly matching this structure:
{
  "title": "${topic} (${difficulty})",
  "subject": "${topic}",
  "durationMinutes": 10,
  "questions": [
    {
      "id": "q1",
      "question": "<the question text>",
      "options": ["<option 0>", "<option 1>", "<option 2>", "<option 3>"],
      "correctOptionIndex": <0, 1, 2, or 3>,
      "explanation": "<concise explanation why this option is correct>"
    }
  ]
}
Only output valid JSON. Do not include markdown code block formatting.`;

    const responseText = await generateContentWithFallback(prompt);

    let testData;
    try {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      testData = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    } catch {
      throw new Error('Failed to parse AI generated quiz format.');
    }

    // Normalize questions to guarantee valid fields and reliable IDs
    const normalizedQuestions = (testData.questions || []).map((q, idx) => ({
      id: q.id ? String(q.id) : `q_${idx + 1}`,
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 ? q.correctOptionIndex : 0,
      explanation: q.explanation || 'Refer to documentation for this concept.'
    }));

    const savedTestId = 'test-ai-' + Date.now();
    const testRecord = {
      id: savedTestId,
      title: testData.title || `${topic} (${difficulty})`,
      subject: testData.subject || topic,
      difficulty: difficulty,
      durationMinutes: testData.durationMinutes || 10,
      questions: normalizedQuestions
    };

    // Save the new AI-generated test into MongoDB Atlas if connected
    const db = getDB();
    if (db) {
      try {
        await db.collection('tests').insertOne({
          ...testRecord,
          createdAt: new Date()
        });
      } catch (e) {
        console.warn('Atlas quiz save notice:', e.message);
      }
    }

    // Crucial: Cache in MOCK_TESTS array so POST /:id/submit can evaluate and score it!
    MOCK_TESTS.push(testRecord);

    // Sanitize questions (hide correct answers so student cannot cheat)
    const sanitizedQuestions = normalizedQuestions.map(({ id, question, options }) => ({
      id,
      question,
      options
    }));

    res.json({
      success: true,
      test: {
        id: savedTestId,
        title: testData.title,
        subject: testData.subject,
        durationMinutes: testData.durationMinutes || 10,
        questions: sanitizedQuestions
      }
    });
  } catch (error) {
    console.warn('Gemini quiz generation notice (using structured fallback quiz):', error.message);
    const topic = req.body.topic || 'Computer Science';
    const difficulty = req.body.difficulty || 'Intermediate';
    const savedTestId = 'test-ai-' + Date.now();

    const fallbackQuestions = [
      {
        id: 'q1',
        question: `In ${topic}, what is the fundamental purpose of core abstraction and modularity?`,
        options: [
          'To increase memory consumption',
          'To isolate components and reduce architectural coupling',
          'To disable network access',
          'To prevent file reading on the server'
        ],
        correctOptionIndex: 1,
        explanation: 'Modularity and abstraction decouple components, making code easier to test, maintain, and scale.'
      },
      {
        id: 'q2',
        question: `Which of the following is considered an industry best practice when designing ${topic} applications?`,
        options: [
          'Hardcoding credentials directly in source files',
          'Ignoring error and exception handling in production',
          'Separation of concerns and automated testing',
          'Disabling data validation on input fields'
        ],
        correctOptionIndex: 2,
        explanation: 'Separation of concerns ensures clean architecture, maintainability, and robust testability.'
      },
      {
        id: 'q3',
        question: `How does efficient caching improve the overall throughput of a ${topic} system?`,
        options: [
          'By bypassing expensive repetitive computations and database queries',
          'By deleting records permanently after first retrieval',
          'By forcing re-computation on every incoming client request',
          'By converting all responses into plain text files'
        ],
        correctOptionIndex: 0,
        explanation: 'Caching keeps frequently requested results in high-speed memory, cutting latency and database load.'
      }
    ];

    const fallbackTestRecord = {
      id: savedTestId,
      title: `${topic} (${difficulty})`,
      subject: topic,
      difficulty,
      durationMinutes: 10,
      questions: fallbackQuestions
    };

    MOCK_TESTS.push(fallbackTestRecord);

    res.json({
      success: true,
      test: {
        id: savedTestId,
        title: fallbackTestRecord.title,
        subject: fallbackTestRecord.subject,
        durationMinutes: 10,
        questions: fallbackQuestions.map(({ id, question, options }) => ({ id, question, options }))
      }
    });
  }
});

export default router;
