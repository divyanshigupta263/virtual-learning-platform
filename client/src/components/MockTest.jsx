import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, XCircle, Award, RotateCcw, Sparkles, RefreshCw, History, ArrowRight } from 'lucide-react';

export default function MockTest() {
  const [catalog, setCatalog] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom AI Quiz Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
  const [isGeneratingAiTest, setIsGeneratingAiTest] = useState(false);

  // Past test history
  const [testHistory, setTestHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 1. Fetch available test catalog on load
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/test');
      const data = await res.json();
      if (data.success) {
        setCatalog(data.tests || []);
      }
    } catch (err) {
      console.error('Failed to load test catalog:', err);
    }
  };

  // 2. Timer Countdown Effect
  useEffect(() => {
    if (!activeTest || isSubmitted || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, isSubmitted, timeLeftSeconds]);

  // 3. Start a test
  const handleStartTest = async (testId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/test/${testId}`);
      const data = await res.json();
      if (data.success && data.test) {
        setActiveTest(data.test);
        setUserAnswers({});
        setIsSubmitted(false);
        setResultSummary(null);
        setTimeLeftSeconds((data.test.durationMinutes || 10) * 60);
      } else {
        alert(data.error || 'Failed to start test.');
      }
    } catch (err) {
      alert('Error starting test: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Generate AI Quiz dynamically on the fly
  const handleGenerateAiQuiz = async () => {
    if (!aiTopic.trim()) {
      alert('Please enter a topic for the AI quiz (e.g., Python, Docker, DSA).');
      return;
    }
    setIsGeneratingAiTest(true);
    try {
      const res = await fetch('/api/test/generate-ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          difficulty: aiDifficulty,
          questionCount: 3
        }),
      });
      const data = await res.json();
      if (data.success && data.test) {
        setActiveTest(data.test);
        setUserAnswers({});
        setIsSubmitted(false);
        setResultSummary(null);
        setTimeLeftSeconds((data.test.durationMinutes || 10) * 60);
        fetchCatalog(); // Refresh catalog in background
      } else {
        alert(data.error || 'Failed to generate AI quiz.');
      }
    } catch (err) {
      alert('Error generating AI test: ' + err.message);
    } finally {
      setIsGeneratingAiTest(false);
    }
  };

  // 5. Submit Answers
  const handleSubmitTest = async () => {
    if (!activeTest || isSubmitted) return;
    try {
      const res = await fetch(`/api/test/${activeTest.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setResultSummary(data);
        setIsSubmitted(true);
      } else {
        alert(data.error || 'Submission failed.');
      }
    } catch (err) {
      alert('Error submitting test: ' + err.message);
    }
  };

  // 6. Fetch past test history from MongoDB Atlas
  const handleFetchHistory = async () => {
    try {
      const res = await fetch('/api/test/history/all');
      const data = await res.json();
      if (data.success) {
        setTestHistory(data.history || []);
        setShowHistory(true);
      }
    } catch (err) {
      alert('Error fetching test history: ' + err.message);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-2xl gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mock Test & Assessment Dashboard</h2>
            <p className="text-sm text-slate-500 font-medium">Timed technical quizzes, AI dynamic quiz generator & auto-grading</p>
          </div>
        </div>

        <button
          onClick={handleFetchHistory}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 border border-slate-200 transition shadow-sm"
        >
          <History className="w-4 h-4 text-violet-600" /> Past Test Scores
        </button>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="bg-white border border-violet-200 p-6 rounded-2xl space-y-4 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-violet-600" /> Saved Test Records (MongoDB Atlas)
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>

          {testHistory?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No tests submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {testHistory?.map((item) => (
                <div key={item._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-violet-700">{item.testTitle}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.correctCount}/{item.totalQuestions} correct • Grade {item.grade}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-extrabold ${item.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.scorePercentage}%
                    </span>
                    <p className="text-[10px] text-slate-400">{new Date(item.savedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Catalog or Active Test */}
      {!activeTest ? (
        <div className="space-y-6">
          {/* AI Custom Quiz Generator Card */}
          <div className="bg-gradient-to-r from-violet-50 via-white to-white border border-violet-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900">Generate a Custom AI Quiz on Any Topic</h3>
            </div>
            <p className="text-xs text-slate-600">
              Type any subject (e.g. Python, Machine Learning, Cloud, SQL) and Google Gemini AI will generate a fresh timed quiz instantly!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Enter topic (e.g., Python OOP, Docker Containers, DSA Trees)..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder-slate-400"
              />

              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <button
                onClick={handleGenerateAiQuiz}
                disabled={isGeneratingAiTest}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md shadow-violet-600/20 whitespace-nowrap"
              >
                {isGeneratingAiTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate & Start
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Standard Catalog */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Available Practice Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalog.map((test) => (
                <div
                  key={test.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-violet-400 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900">{test.title}</h4>
                      <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-semibold border border-violet-100">
                        {test.difficulty || 'Intermediate'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mb-4">
                      <Clock className="w-3.5 h-3.5 text-violet-600" /> {test.durationMinutes} Minutes • {test.totalQuestions} Questions
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartTest(test.id)}
                    disabled={loading}
                    className="w-full py-2.5 bg-slate-50 hover:bg-violet-600 hover:text-white text-slate-700 font-semibold rounded-xl text-xs transition border border-slate-200 flex items-center justify-center gap-2"
                  >
                    Start Test <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Test Runner */
        <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
          {/* Top Bar with Timer */}
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900">{activeTest.title}</h3>
              <p className="text-xs text-slate-500">{activeTest.subject}</p>
            </div>

            {!isSubmitted && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-amber-700 font-mono font-bold text-base border border-amber-300 shadow-xs">
                <Clock className="w-4 h-4 animate-pulse text-amber-600" />
                {formatTime(timeLeftSeconds)}
              </div>
            )}
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {activeTest.questions.map((q, qIdx) => {
              const selectedOption = userAnswers[q.id];
              const resultItem = resultSummary?.breakdown?.find((b) => b.questionId === q.id);

              return (
                <div key={q.id} className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                  <p className="font-semibold text-slate-900 text-sm">
                    {qIdx + 1}. {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';

                      if (isSubmitted && resultItem) {
                        if (optIdx === resultItem.correctOptionIndex) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                        } else if (isSelected && !resultItem.isCorrect) {
                          btnStyle = 'bg-rose-50 border-rose-500 text-rose-900';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-violet-50 border-violet-500 text-violet-900 font-semibold shadow-xs';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            if (isSubmitted) return;
                            setUserAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }}
                          disabled={isSubmitted}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs transition flex justify-between items-center ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && resultItem && optIdx === resultItem.correctOptionIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {isSubmitted && resultItem && isSelected && !resultItem.isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {isSubmitted && resultItem && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                      <strong className="text-slate-800">Explanation:</strong> {resultItem.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {!isSubmitted ? (
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSubmitTest}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20"
              >
                Submit Test for Scoring
              </button>
              <button
                onClick={() => setActiveTest(null)}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 transition"
              >
                Exit
              </button>
            </div>
          ) : (
            resultSummary && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-sm animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-7 h-7 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Performance Report</h4>
                      <p className="text-xs text-slate-500 font-medium">Permanently saved to MongoDB Atlas</p>
                    </div>
                  </div>

                  <span className={`px-4 py-1.5 rounded-full font-bold text-xs ${
                    resultSummary.summary.passed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {resultSummary.summary.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Score</p>
                    <p className="text-xl font-bold text-violet-700">
                      {resultSummary.summary.correctCount} / {resultSummary.summary.totalQuestions}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Percentage</p>
                    <p className="text-xl font-bold text-emerald-600">{resultSummary.summary.scorePercentage}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Grade</p>
                    <p className="text-xl font-bold text-amber-600">{resultSummary.summary.grade}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTest(null)}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md shadow-violet-600/20"
                >
                  <RotateCcw className="w-4 h-4" /> Back to Test Catalog
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
