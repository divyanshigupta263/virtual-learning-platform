import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Fallback models in case of high demand
const MODEL_CANDIDATES = ['gemini-3.8-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];

/**
 * Helper to generate content with fallback models
 */
const generateContentWithFallback = async (prompt) => {
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

export default router;
