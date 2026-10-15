import React, { useState } from 'react';
import { Bot, Send, Award, CheckCircle2, AlertCircle, RefreshCw, BookOpen, History, ArrowRight } from 'lucide-react';

export default function MockInterview() {
  const [topic, setTopic] = useState('React.js');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [pastHistory, setPastHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 1. Generate Interview Questions via Gemini API
  const handleStart = async () => {
    setIsGenerating(true);
    setEvaluation(null);
    setAnswer('');
    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, questionCount: Number(questionCount) }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setCurrentIndex(0);
      } else {
        alert(data.error || 'Failed to generate questions.');
      }
    } catch (err) {
      alert('Error connecting to backend: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Submit Answer for Gemini Evaluation (Auto-saved to MongoDB Atlas)
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          question: questions[currentIndex],
          answer: answer.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
      } else {
        alert(data.error || 'Evaluation failed.');
      }
    } catch (err) {
      alert('Error evaluating answer: ' + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 3. Fetch past history from MongoDB Atlas
  const handleFetchHistory = async () => {
    try {
      const res = await fetch('/api/interview/history/all');
      const data = await res.json();
      if (data.success) {
        setPastHistory(data.history || []);
        setShowHistory(true);
      }
    } catch (err) {
      alert('Error fetching history: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-2xl gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AI Mock Interview</h2>
            <p className="text-sm text-slate-500 font-medium">Targeted technical interview simulations powered by Google Gemini AI</p>
          </div>
        </div>

        <button
          onClick={handleFetchHistory}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 border border-slate-200 transition shadow-sm"
        >
          <History className="w-4 h-4 text-indigo-600" /> View Past History
        </button>
      </div>

      {/* History Modal / Drawer */}
      {showHistory && (
        <div className="bg-white border border-indigo-200 p-6 rounded-2xl space-y-4 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Saved Cloud History (MongoDB Atlas)
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>

          {pastHistory?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No past interviews saved yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pastHistory?.map((item) => (
                <div key={item._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-indigo-700">{item.topic || item.subject}</span>
                    <span className="text-xs text-slate-500 ml-2">({item.type || 'interview'})</span>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.question}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-600">
                      {item.type === 'viva' ? `${item.score}/10` : `${item.score}/100`}
                    </span>
                    <p className="text-[10px] text-slate-400">{new Date(item.savedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Setup Form or Active Question */}
      {questions.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Configure Your Interview Session</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Topic / Technology</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="React.js">React.js</option>
                <option value="Node.js & Express">Node.js & Express</option>
                <option value="Python Programming">Python Programming</option>
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="MongoDB & Databases">MongoDB & Databases</option>
                <option value="System Design & Cloud">System Design & Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="Beginner">Beginner (Foundations)</option>
                <option value="Intermediate">Intermediate (Real-world concepts)</option>
                <option value="Advanced">Advanced (Internals & Optimization)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Question Count</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value={3}>3 Questions (Quick Practice)</option>
                <option value={5}>5 Questions (Standard Round)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={isGenerating}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> Gemini AI is Generating Your Interview Questions...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" /> Start AI Interview
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Interview Questions Area */
        <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-600">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
              {topic} • {difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 leading-relaxed">
              {questions[currentIndex]}
            </h3>
          </div>

          {/* Student Answer Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Your Technical Answer:
            </label>
            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain the concept clearly with relevant details..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none placeholder-slate-400"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmitAnswer}
              disabled={isEvaluating || !answer.trim()}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Gemini AI Evaluating Your Answer...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit for AI Evaluation
                </>
              )}
            </button>

            <button
              onClick={() => {
                setQuestions([]);
                setEvaluation(null);
              }}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 transition"
            >
              Reset Session
            </button>
          </div>

          {/* AI Evaluation Report Card */}
          {evaluation && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <Award className="w-7 h-7 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">AI Performance Assessment</h4>
                    <p className="text-xs text-slate-500 font-medium">Permanently saved to MongoDB Atlas</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-extrabold text-emerald-600">{evaluation.score}</span>
                  <span className="text-sm text-slate-500 font-semibold"> / 100</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Correctness:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  evaluation.correctness === 'Fully Correct' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  evaluation.correctness === 'Partially Correct' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {evaluation.correctness}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Constructive Feedback:</p>
                <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed shadow-xs">
                  {evaluation.feedback}
                </p>
              </div>

              {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Key Missing Concepts:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1.5 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                    {evaluation.missingPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Question Navigation */}
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => prev + 1);
                    setAnswer('');
                    setEvaluation(null);
                  }}
                  className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> All questions completed! Great job.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
