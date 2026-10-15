# 🎓 Virtual Learning Platform - AI & Assessment Suite

An AI-powered, full-stack Virtual Learning Platform engineered to unify concept learning, hands-on assessment, automated AI technical interviews, and oral vivas within a modern web environment.

Developed as the **Core AI & Assessment Engine** for the 4-member final year project.

---

## 🌟 Core Modules

### 1. 🤖 AI Mock Interview
- **Dynamic Question Generation**: Leverages Google Gemini AI to generate technical interview questions tailored by technology (*React, Python, Node, DSA, System Design, MongoDB*) and difficulty (*Beginner, Intermediate, Advanced*).
- **In-Depth Answer Evaluation**: Analyzes technical responses in real-time, providing:
  - **Score**: 0 to 100
  - **Correctness Tag**: *Fully Correct*, *Partially Correct*, or *Incorrect*
  - **Key Missing Concepts**: Bulleted list of omitted architectural/operational details
  - **Constructive Feedback & Actionable Improvement Advice**
- **Cloud Persistence**: Automatically stores every interview evaluation in MongoDB Atlas.

### 2. 📝 Mock Test & Assessment Dashboard
- **Standard Practice Catalog**: Curated tests on Web Development, Computer Science, and Algorithms with predefined durations and question counts.
- **Dynamic AI Quiz Generator**: Type any subject on-the-fly (*Docker, Machine Learning, OOP, Cloud*), and Gemini AI generates a fresh 4-option MCQ quiz with an answer key and explanations.
- **Timed Test Runner**: Real-time countdown timer with auto-submit protection.
- **Instant Auto-Grading**: Generates percentage scores, letter grades (*A, B, C, F*), pass/fail status, and question-by-question breakdown with detailed explanations.

### 3. 🎤 AI Viva (Oral Examiner)
- **Interactive Oral Examination**: Simulates an academic professor conducting a viva voce examination across core CS disciplines (*OS, DBMS, Networks, DSA, OOP*).
- **Text-to-Speech (TTS)**: The AI examiner reads questions aloud through the browser.
- **Speech-to-Text (STT)**: Students can speak their answers directly via the microphone.
- **Examiner Feedback & Score**: Instant rating (1–10) and verdict (*Excellent, Satisfactory, Needs Revision*).
- **Conversational Follow-Up Flow**: The examiner reacts dynamically to the student's answer and asks logical follow-up questions.

---

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, Modern JavaScript (ES6+), Tailwind CSS (CDN), Lucide Icons
- **Backend**: Node.js, Express.js (ES Modules, RESTful APIs, Static File Hosting)
- **Artificial Intelligence**: Google Gemini API (`@google/generative-ai`, `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`)
- **Database**: MongoDB Atlas Cloud + Local Persistent Fallback (`data_storage.json`)
- **Speech Integration**: Web Speech API (`SpeechSynthesis` Text-to-Speech & `webkitSpeechRecognition` Speech-to-Text)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies & Configure
In the `server/` directory, ensure dependencies are installed and `.env` has your keys:
```bash
cd server
npm install
```

### 2. Run the Platform (Single Command!)
```bash
node index.js
```
Open **[http://localhost:5000](http://localhost:5000)** in any browser. The entire application runs directly!

*Alternative for VS Code*: Right-click `public/index.html` and click **"Open with Live Server"** (runs on port 5500 while connected to backend on port 5000).

*(Optional React Frontend)*: A React 18 / Vite version is also maintained in `client/` (`cd client && npm run dev`).

---

## 📡 API Documentation
For detailed API specifications, request/response formats, and integration notes for teammates, see [API_DOCS.md](./API_DOCS.md).

---

## 👨‍💻 Architecture & Project Structure

```text
virtual-learning-platform/
├── API_DOCS.md               # Complete team REST API documentation
├── README.md                 # Project overview and documentation
├── .gitignore                # Protects secrets & node_modules
├── server/                   # Express.js Backend Server
│   ├── .env                  # Private API keys & database URI
│   ├── .env.example          # Environment template
│   ├── index.js              # Server entry point & CORS configuration
│   ├── db.js                 # Native MongoDB Atlas driver with DNS resolution fix
│   └── routes/
│       ├── interview.js      # Gemini AI Mock Interview & Viva routes
│       └── test.js           # Assessment catalog, auto-grader & AI quiz generator
└── client/                   # React.js Frontend
    ├── index.html            # Application entry HTML (Light Theme)
    ├── vite.config.js        # Vite config with backend proxy (/api -> :5000)
    ├── tailwind.config.js    # Tailwind CSS design system
    └── src/
        ├── App.jsx           # Main tab navigation bar
        ├── index.css         # Tailwind global styles
        ├── main.jsx          # React DOM root
        └── components/
            ├── MockInterview.jsx # AI Mock Interview UI & history viewer
            ├── MockTest.jsx      # Assessment dashboard & AI quiz runner
            └── AIViva.jsx        # Oral viva examiner with voice I/O
```
