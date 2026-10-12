import express from 'express';

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
router.post('/:id/submit', (req, res) => {
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
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= 60; // 60% passing threshold

  res.json({
    success: true,
    testId: test.id,
    testTitle: test.title,
    summary: {
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      scorePercentage,
      passed,
      grade: scorePercentage >= 85 ? 'A' : scorePercentage >= 70 ? 'B' : scorePercentage >= 60 ? 'C' : 'F'
    },
    breakdown
  });
});

export default router;
