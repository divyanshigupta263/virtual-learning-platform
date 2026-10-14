import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveInterviewReport, getDB } from '../db.js';

const router = express.Router();

// Fallback models in case of high demand
const MODEL_CANDIDATES = ['gemini-3-flash-preview', 'gemini-3.8-flash'];
/**
 * Helper to generate content with fallback models
 */
export const generateContentWithFallback = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing or invalid in server/.env');
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`Model ${modelName} returned error: ${err.message}. Trying next candidate...`);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini AI model candidates failed.');
};

/**
 * POST /api/interview/generate
 * Generates interview questions based on topic and difficulty level.
 */
router.post('/generate', async (req, res) => {
  try {
    const { topic = 'React.js', difficulty = 'Intermediate', questionCount = 3 } = req.body;

    const prompt = `You are a senior technical interviewer. Generate ${questionCount} concise interview questions for a ${difficulty} level candidate on the topic of "${topic}".
Return the response as a clean JSON array of strings only, format: ["Question 1", "Question 2", "Question 3"]. Do not include any extra markdown text outside the JSON array.`;

    const responseText = await generateContentWithFallback(prompt);
    
    // Parse JSON from AI response
    let questions;
    try {
      const jsonStart = responseText.indexOf('[');
      const jsonEnd = responseText.lastIndexOf(']') + 1;
      questions = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    } catch {
      questions = [responseText];
    }

    res.json({
      success: true,
      topic,
      difficulty,
      questions
    });
  } catch (error) {
    console.error('Error generating interview questions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate interview questions.'
    });
  }
});

/**
 * POST /api/interview/evaluate
 * Evaluates student answer against an interview question.
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { question, answer, topic = 'General Technical' } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, error: 'Question and answer are required.' });
    }

    const prompt = `You are an expert AI technical evaluator for an interview on ${topic}.
Question: "${question}"
Candidate Answer: "${answer}"

Evaluate the candidate's answer and return a raw JSON object matching this structure exact format:
{
  "score": <number between 0 and 100>,
  "correctness": "<Fully Correct | Partially Correct | Incorrect>",
  "missingPoints": ["<missing point 1>", "<missing point 2>"],
  "feedback": "<concise constructive feedback>",
  "improvementSuggestions": "<actionable advice for candidate>"
}
Only output valid JSON. Do not include markdown code block formatting.`;

    const responseText = await generateContentWithFallback(prompt);
    
    let evaluation;
    try {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      evaluation = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    } catch {
      evaluation = {
        score: 70,
        correctness: 'Partially Correct',
        missingPoints: ['Requires more detail'],
        feedback: responseText,
        improvementSuggestions: 'Review topic documentation'
      };
    }

    // Automatically save interview evaluation to MongoDB Atlas
    await saveInterviewReport({
      type: 'mock_interview',
      topic,
      question,
      answer,
      score: evaluation.score,
      correctness: evaluation.correctness,
      feedback: evaluation.feedback
    });

    res.json({
      success: true,
      question,
      evaluation
    });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate answer.'
    });
  }
});
/**
 * POST /api/interview/viva/question
 * Generates a rapid-fire viva oral question for a chosen subject
 */
router.post('/viva/question', async (req, res) => {
  try {
    const { subject = 'Operating Systems', topic = 'Process Management' } = req.body;

    const prompt = `You are a university viva examiner conducting an oral exam on "${subject}" (topic: ${topic}).
Generate 1 direct, concise viva question testing core fundamental understanding.
Return only the question text directly in 1-2 sentences. Do not include greetings or quotes.`;

    const question = await generateContentWithFallback(prompt);

    res.json({
      success: true,
      subject,
      question: question.trim()
    });
  } catch (error) {
    console.error('Error generating viva question:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate viva question.'
    });
  }
});

/**
 * POST /api/interview/viva/evaluate
 * Evaluates candidate oral answer: score (1-10), verdict, feedback & follow-up question
 */
router.post('/viva/evaluate', async (req, res) => {
  try {
    const { subject = 'Computer Science', question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, error: 'Question and answer are required.' });
    }

    const prompt = `You are an academic viva examiner assessing a student oral answer in "${subject}".
Viva Question: "${question}"
Student Oral Answer: "${answer}"

Evaluate the answer and return raw JSON strictly matching this format:
{
  "score": <number between 1 and 10>,
  "verdict": "<Excellent | Satisfactory | Needs Revision>",
  "examinerFeedback": "<1-2 sentences oral reaction explaining what was correct or missing>",
  "followUpQuestion": "<1 logical follow-up viva question based on what the student said>"
}
Only output valid JSON. Do not include markdown code block formatting.`;

    const responseText = await generateContentWithFallback(prompt);

    let evaluation;
    try {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      evaluation = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    } catch {
      evaluation = {
        score: 7,
        verdict: 'Satisfactory',
        examinerFeedback: responseText,
        followUpQuestion: 'Can you elaborate further on this concept?'
      };
    }

    // Automatically save viva evaluation to MongoDB Atlas
    await saveInterviewReport({
      type: 'viva',
      subject,
      question,
      answer,
      score: evaluation.score,
      verdict: evaluation.verdict,
      examinerFeedback: evaluation.examinerFeedback
    });

    res.json({
      success: true,
      subject,
      question,
      evaluation
    });
  } catch (error) {
    console.error('Error evaluating viva answer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate viva answer.'
    });
  }
});

/**
 * GET /api/interview/history/all
 * Retrieves all saved interview & viva records from MongoDB Atlas
 */
router.get('/history/all', async (req, res) => {
  try {
    const db = getDB();
    if (!db) return res.json({ success: true, history: [] });
    const history = await db.collection('interview_history').find({}).sort({ savedAt: -1 }).toArray();
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
