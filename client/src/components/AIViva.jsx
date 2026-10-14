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
        // Automatically speak question aloud if speech synthesis is available
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
      window.speechSynthesis.cancel(); // Stop any ongoing speech
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
        // filter for viva records
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-600/30">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">AI Viva Oral Examiner</h2>
            <p className="text-sm text-slate-400">Simulate rapid oral technical examinations with interactive voice & examiner feedback</p>
          </div>
        </div>

        <button
          onClick={handleFetchHistory}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-700 transition"
        >
          <History className="w-4 h-4 text-rose-400" /> Past Viva Records
        </button>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-slate-900 border border-rose-500/40 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-400" /> Saved Viva Scores (MongoDB Atlas)
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
            >
              Close
            </button>
          </div>

          {history?.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No viva records saved yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {history?.map((item) => (
                <div key={item._id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-rose-300">{item.subject}</span>
                    <span className="text-xs text-slate-500 ml-2">({item.verdict})</span>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.question}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-400">{item.score}/10</span>
                    <p className="text-[10px] text-slate-500">{new Date(item.savedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Viva Setup or Active Session */}
      {!question ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-200">Start Oral Examination Round</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Operating Systems">Operating Systems</option>
                <option value="Database Management Systems (DBMS)">Database Management Systems (DBMS)</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Object Oriented Programming">Object Oriented Programming</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Topic Focus</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Deadlocks, Indexing, TCP/IP, Trees..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => handleAskQuestion()}
            disabled={isGenerating}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-rose-600/30"
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
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-rose-400">
              Oral Question ({subject})
            </span>
            <button
              onClick={() => speakText(question)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-400" /> Listen
            </button>
          </div>

          {/* Question Text */}
          <div className="p-5 bg-slate-800/70 border border-slate-700 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-rose-300 font-semibold mb-1">Examiner asks:</p>
              <h3 className="text-lg font-semibold text-slate-100 leading-relaxed">{question}</h3>
            </div>
          </div>

          {/* Student Oral Answer Box */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Spoken Answer:
              </label>

              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Recording... (Click to Stop)
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-rose-400" /> Speak into Mic (Voice Typing)
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak using the mic button above, or type your answer here..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmitAnswer}
              disabled={isEvaluating || !answer.trim()}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
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
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium border border-slate-700 transition"
            >
              Change Subject
            </button>
          </div>

          {/* Examiner Evaluation Card */}
          {evaluation && (
            <div className="p-6 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-5 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <Award className="w-7 h-7 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-slate-100 text-lg">Examiner Assessment</h4>
                    <p className="text-xs text-slate-400">Permanently saved to MongoDB Atlas</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-extrabold text-emerald-400">{evaluation.score}</span>
                  <span className="text-sm text-slate-400"> / 10</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Verdict:</span>
                <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                  evaluation.verdict === 'Excellent' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                  evaluation.verdict === 'Satisfactory' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                  'bg-rose-950 text-rose-300 border border-rose-700'
                }`}>
                  {evaluation.verdict}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Examiner Feedback:</p>
                  <button
                    onClick={() => speakText(evaluation.examinerFeedback)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
                <p className="text-sm text-slate-200 bg-slate-900 p-4 rounded-xl border border-slate-700/50 leading-relaxed">
                  {evaluation.examinerFeedback}
                </p>
              </div>

              {/* Follow-up question from examiner */}
              {evaluation.followUpQuestion && (
                <div className="p-4 bg-indigo-950/40 border border-indigo-700/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Bot className="w-4 h-4" /> Examiner's Next Follow-Up Question:
                  </div>
                  <p className="text-sm text-slate-200 italic">"{evaluation.followUpQuestion}"</p>

                  <button
                    onClick={() => {
                      setQuestion(evaluation.followUpQuestion);
                      setEvaluation(null);
                      setAnswer('');
                      speakText(evaluation.followUpQuestion);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"
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
