# 📘 Virtual Learning Platform - Team API Integration Guide

This guide is for the team members to integrate with the **AI Mock Interview**, **Test / Assessment Dashboard**, and **AI Viva** backend services.

- **Base URL (Local)**: `http://localhost:5000`
- **Content-Type**: `application/json`
- **Database**: MongoDB Atlas Cloud (`virtual_learning_db`)
- **AI Engine**: Google Gemini API (`gemini-3-flash-preview`)

---

## 1. 🤖 AI Mock Interview Module

### 1.1 Generate Technical Interview Questions
- **Endpoint**: `POST /api/interview/generate`
- **Description**: Generates concise technical interview questions based on topic and candidate difficulty.
- **Request Body**:
```json
{
  "topic": "React.js",
  "difficulty": "Intermediate",
  "questionCount": 3
}
```
- **Response**:
```json
{
  "success": true,
  "topic": "React.js",
  "difficulty": "Intermediate",
  "questions": [
    "What is the difference between controlled and uncontrolled components?",
    "How does React handle reconciliation when rendering lists with keys?",
    "Explain the purpose and dependency array behavior of useEffect."
  ]
}
```

---

### 1.2 Evaluate Student Technical Answer
- **Endpoint**: `POST /api/interview/evaluate`
- **Description**: Evaluates candidate answer, generates a score (0–100), detects missing points, provides constructive feedback, and **automatically saves the evaluation into MongoDB Atlas**.
- **Request Body**:
```json
{
  "topic": "React.js",
  "question": "What is the difference between state and props in React?",
  "answer": "Props are passed from parent to child and are read-only, while state is managed internally by the component."
}
```
- **Response**:
```json
{
  "success": true,
  "question": "What is the difference between state and props in React?",
  "evaluation": {
    "score": 75,
    "correctness": "Partially Correct",
    "missingPoints": [
      "State updates cause re-renders",
      "Props facilitate unidirectional data flow"
    ],
    "feedback": "Good fundamental understanding, but misses operational lifecycle details.",
    "improvementSuggestions": "Elaborate on how state updates trigger re-renders."
  }
}
```

---

### 1.3 Get Past Interview & Viva History
- **Endpoint**: `GET /api/interview/history/all`
- **Description**: Retrieves all saved AI mock interviews and vivas from MongoDB Atlas.
- **Response**:
```json
{
  "success": true,
  "count": 5,
  "history": [
    {
      "_id": "6acf45d9bbb3e6ca6b164459",
      "type": "viva",
      "subject": "Operating Systems",
      "question": "What is a deadlock?",
      "score": 9,
      "verdict": "Excellent",
      "examinerFeedback": "Your answer is precise...",
      "savedAt": "2026-10-14T09:05:29.830Z"
    }
  ]
}
```

---

## 2. 🎤 AI Viva (Oral Examiner) Module

### 2.1 Generate Oral Viva Question
- **Endpoint**: `POST /api/interview/viva/question`
- **Description**: Generates a rapid-fire viva question testing foundational technical principles.
- **Request Body**:
```json
{
  "subject": "Operating Systems",
  "topic": "Process Management"
}
```
- **Response**:
```json
{
  "success": true,
  "subject": "Operating Systems",
  "question": "What specific information does the Process Control Block store, and why is context switching considered overhead?"
}
```

---

### 2.2 Evaluate Viva Oral Answer & Get Follow-Up Question
- **Endpoint**: `POST /api/interview/viva/evaluate`
- **Description**: Assesses oral response, gives score (1–10), examiner verdict, oral reaction, generates next conversational follow-up question, and **auto-saves to MongoDB Atlas**.
- **Request Body**:
```json
{
  "subject": "Operating Systems",
  "question": "What is a deadlock and what are the four necessary conditions?",
  "answer": "Deadlock is a condition where processes are waiting on each other for resources. Conditions are mutual exclusion, hold and wait, no preemption, and circular wait."
}
```
- **Response**:
```json
{
  "success": true,
  "subject": "Operating Systems",
  "question": "What is a deadlock and what are the four necessary conditions?",
  "evaluation": {
    "score": 9,
    "verdict": "Excellent",
    "examinerFeedback": "Your answer is precise and correctly identifies all four Coffman conditions.",
    "followUpQuestion": "If we wanted to prevent deadlock by attacking 'Circular Wait', what rule should we implement?"
  }
}
```

---

## 3. 📝 Mock Test & Assessment Dashboard Module

### 3.1 Get Test Catalog
- **Endpoint**: `GET /api/test`
- **Description**: Returns all available tests with question counts and time limits.
- **Response**:
```json
{
  "success": true,
  "tests": [
    {
      "id": "test-react-01",
      "title": "React.js Core & Hooks Mastery",
      "subject": "Web Development",
      "difficulty": "Intermediate",
      "durationMinutes": 10,
      "totalQuestions": 4
    }
  ]
}
```

---

### 3.2 Get Test Questions (Anti-Cheat)
- **Endpoint**: `GET /api/test/:id`
- **Description**: Returns questions and options (answer keys are hidden on the server).
- **Response**:
```json
{
  "success": true,
  "test": {
    "id": "test-react-01",
    "title": "React.js Core & Hooks Mastery",
    "subject": "Web Development",
    "durationMinutes": 10,
    "questions": [
      {
        "id": "q1",
        "question": "Which hook is used for side effects?",
        "options": ["useMemo", "useEffect", "useCallback", "useContext"]
      }
    ]
  }
}
```

---

### 3.3 Submit Test for Auto-Grading
- **Endpoint**: `POST /api/test/:id/submit`
- **Description**: Evaluates submitted options, calculates score, percentage, grade, pass/fail status, question breakdown with explanations, and **auto-saves to MongoDB Atlas**.
- **Request Body**:
```json
{
  "answers": {
    "q1": 1,
    "q2": 1,
    "q3": 0
  }
}
```
- **Response**:
```json
{
  "success": true,
  "testId": "test-react-01",
  "testTitle": "React.js Core & Hooks Mastery",
  "summary": {
    "totalQuestions": 3,
    "correctCount": 2,
    "incorrectCount": 1,
    "scorePercentage": 67,
    "passed": true,
    "grade": "C"
  },
  "breakdown": [
    {
      "questionId": "q1",
      "question": "Which hook is used for side effects?",
      "selectedOptionIndex": 1,
      "correctOptionIndex": 1,
      "isCorrect": true,
      "explanation": "useEffect is designed specifically for side effects."
    }
  ]
}
```

---

### 3.4 Generate Dynamic AI Quiz on Any Topic
- **Endpoint**: `POST /api/test/generate-ai-test`
- **Description**: Google Gemini generates a timed Multiple-Choice Quiz on any custom topic and stores it in MongoDB Atlas.
- **Request Body**:
```json
{
  "topic": "Python Programming",
  "difficulty": "Intermediate",
  "questionCount": 3
}
```
- **Response**:
```json
{
  "success": true,
  "test": {
    "id": "6acca6f34866bf443f9af49",
    "title": "Python Programming (Intermediate)",
    "subject": "Python Programming",
    "durationMinutes": 10,
    "questions": [ ... ]
  }
}
```

---

### 3.5 Get Past Test Scores History
- **Endpoint**: `GET /api/test/history/all`
- **Description**: Retrieves all completed test submissions from MongoDB Atlas.
- **Response**:
```json
{
  "success": true,
  "count": 12,
  "history": [
    {
      "_id": "6acc9f7234d93edb8c14f28d",
      "testId": "test-react-01",
      "testTitle": "React.js Core & Hooks Mastery",
      "totalQuestions": 4,
      "correctCount": 4,
      "scorePercentage": 100,
      "passed": true,
      "grade": "A",
      "savedAt": "2026-10-12T08:50:58.275Z"
    }
  ]
}
```
