import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Google Gemini API
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing or invalid in server/.env');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * POST /api/interview/generate
 * Generates interview questions based on topic and difficulty level.
 */
router.post('/generate', async (req, res) => {
  try {
    const { topic = 'React.js', difficulty = 'Intermediate', questionCount = 3 } = req.body;

    const model = getGeminiModel();

    const prompt = `You are a senior technical interviewer. Generate ${questionCount} concise interview questions for a ${difficulty} level candidate on the topic of "${topic}".
Return the response as a clean JSON array of strings only, format: ["Question 1", "Question 2", "Question 3"]. Do not include any extra markdown text outside the JSON array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
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

    const model = getGeminiModel();

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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
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
