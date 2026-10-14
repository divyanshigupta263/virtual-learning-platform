import React, { useState } from 'react';
import MockInterview from './components/MockInterview';
import MockTest from './components/MockTest';
import AIViva from './components/AIViva';
import { Bot, FileText, Mic, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('interview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-4 px-6 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-300 to-rose-400 bg-clip-text text-transparent">
                Virtual Learning Platform
              </h1>
              <p className="text-xs text-slate-400">AI Mock Interview, Dynamic Assessment & Viva Suite</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'interview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Bot className="w-4 h-4" /> AI Mock Interview
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'test'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" /> Mock Tests
            </button>

            <button
              onClick={() => setActiveTab('viva')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'viva'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Mic className="w-4 h-4" /> AI Viva
            </button>
          </nav>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 my-2">
        {activeTab === 'interview' && <MockInterview />}
        {activeTab === 'test' && <MockTest />}
        {activeTab === 'viva' && <AIViva />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        AI Assessment & Mock Interview Module • Powered by Google Gemini AI & MongoDB Atlas
      </footer>
    </div>
  );
}
