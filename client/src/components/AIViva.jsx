import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Bot, Send, Award, RefreshCw, CheckCircle2, History, ArrowRight } from 'lucide-react';

export default function AIViva() {
  const [subject, setSubject] = useState('Operating Systems');
  const [topic, setTopic] = useState('Process Management & Deadlocks');
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Past history state
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 1. Ask AI Examiner for a Viva question
  const handleAskQuestion = async (customSubject, customTopic) => {
    setIsGenerating(true);
    setEvaluation(null);
    setAnswer('');
    try {
      const res = await fetch('/api/interview/viva/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: customSubject || subject,
          topic: customTopic || topic,
        }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        setQuestion(data.question);
        speakText(data.question);
      } else {
        alert(data.error || 'Failed to generate viva question.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Submit oral answer to AI Examiner
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/interview/viva/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          question,
          answer: answer.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
        speakText(data.evaluation.examinerFeedback);
      } else {
        alert(data.error || 'Evaluation failed.');
      }
    } catch (err) {
      alert('Error evaluating viva answer: ' + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 3. Audio helper: Speak text aloud through laptop speakers
  const speakText = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 4. Voice typing: Use laptop microphone (Speech Recognition)
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAnswer((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // 5. Fetch past viva records from MongoDB Atlas
  const handleFetchHistory = async () => {
    try {
      const res = await fetch('/api/interview/history/all');
      const data = await res.json();
      if (data.success) {
        const vivaOnly = (data.history || []).filter((h) => h.type === 'viva');
        setHistory(vivaOnly);
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
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AI Viva Oral Examiner</h2>
            <p className="text-sm text-slate-500 font-medium">Simulate rapid oral technical examinations with interactive voice & examiner feedback</p>
          </div>
        </div>

        <button
          onClick={handleFetchHistory}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 border border-slate-200 transition shadow-sm"
        >
          <History className="w-4 h-4 text-rose-600" /> Past Viva Records
        </button>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-white border border-rose-200 p-6 rounded-2xl space-y-4 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-600" /> Saved Viva Scores (MongoDB Atlas)
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>

          {history?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No viva records saved yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {history?.map((item) => (
                <div key={item._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-rose-700">{item.subject}</span>
                    <span className="text-xs text-slate-500 ml-2">({item.verdict})</span>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.question}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-600">{item.score}/10</span>
                    <p className="text-[10px] text-slate-400">{new Date(item.savedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Viva Setup or Active Session */}
      {!question ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Start Oral Examination Round</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
              >
                <option value="Operating Systems">Operating Systems</option>
                <option value="Database Management Systems (DBMS)">Database Management Systems (DBMS)</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Object Oriented Programming">Object Oriented Programming</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Topic Focus</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Deadlocks, Indexing, TCP/IP, Trees..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>

          <button
            onClick={() => handleAskQuestion()}
            disabled={isGenerating}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-rose-600/20"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> Examiner is preparing viva question...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" /> Begin Viva Session
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Viva Interaction */
        <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-rose-600">
              Oral Question ({subject})
            </span>
            <button
              onClick={() => speakText(question)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-600" /> Listen
            </button>
          </div>

          {/* Question Text */}
          <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-xl flex items-start gap-4">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-rose-700 font-semibold mb-1">Examiner asks:</p>
              <h3 className="text-lg font-semibold text-slate-900 leading-relaxed">{question}</h3>
            </div>
          </div>

          {/* Student Oral Answer Box */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your Spoken Answer:
              </label>

              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Recording... (Click to Stop)
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-rose-600" /> Speak into Mic (Voice Typing)
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak using the mic button above, or type your answer here..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none placeholder-slate-400"
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
                  <RefreshCw className="w-5 h-5 animate-spin" /> Examiner is evaluating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit Oral Answer
                </>
              )}
            </button>

            <button
              onClick={() => {
                setQuestion('');
                setEvaluation(null);
                setAnswer('');
              }}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 transition"
            >
              Change Subject
            </button>
          </div>

          {/* Examiner Evaluation Card */}
          {evaluation && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <Award className="w-7 h-7 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Examiner Assessment</h4>
                    <p className="text-xs text-slate-500 font-medium">Permanently saved to MongoDB Atlas</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-extrabold text-emerald-600">{evaluation.score}</span>
                  <span className="text-sm text-slate-500 font-semibold"> / 10</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Verdict:</span>
                <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                  evaluation.verdict === 'Excellent' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  evaluation.verdict === 'Satisfactory' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {evaluation.verdict}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Examiner Feedback:</p>
                  <button
                    onClick={() => speakText(evaluation.examinerFeedback)}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
                <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed shadow-xs">
                  {evaluation.examinerFeedback}
                </p>
              </div>

              {/* Follow-up question from examiner */}
              {evaluation.followUpQuestion && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Bot className="w-4 h-4 text-indigo-600" /> Examiner's Next Follow-Up Question:
                  </div>
                  <p className="text-sm text-slate-800 italic">"{evaluation.followUpQuestion}"</p>

                  <button
                    onClick={() => {
                      setQuestion(evaluation.followUpQuestion);
                      setEvaluation(null);
                      setAnswer('');
                      speakText(evaluation.followUpQuestion);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    Answer Follow-Up Question <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
