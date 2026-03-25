# HisabHero 🚀

**HisabHero** (formerly FinSight) is a powerful, AI-driven financial dashboard specially designed for small and medium enterprises (SMEs). 

It allows business owners to seamlessly track their cash flow, analyze expense anomalies, parse complex PDF bank statements into usable metrics natively via Gemini AI, and converse natively with a state-of-the-art **Hero Bot** (Global Floating AI Assistant).

---

## 🌟 Key Features

1. **PDF Bank Statement AI Processing:** Upload massive, unformatted bank statement PDFs seamlessly. Our robust **Google Gemini 2.5 Flash** integrated pipeline instantly reads the layout, extracts tabular transactional data exactly, categorizes it, and visualizes the results into your application.
2. **Context-Aware Hero Bot:** Ask your data questions. HisabHero features the **Hero Bot**, a floating, global AI Chatbot that natively understands your *live* dashboard context—it can tell you your current runway, your biggest expense categories, and automatically flag financial anomalies.
3. **AI Executive Reports (Print to PDF):** Instantly generate a comprehensive, structured financial document summarizing your entire live data via a single click. Print flawlessly crafted multi-page PDFs mapping your specific expense categories and runway forecasts securely using isolated print windows.
4. **Advanced Visualizations:** Track the health of your SME visually using detailed cash-flow charts, pie charts, metric read-outs, and a global "Business Health Score".
5. **CSV Bulk Uploading & Smart Mapping:** Map and ingest hundreds of legacy transaction records instantly.
6. **Secure Cloud Persistence:** Completely powered by **MongoDB Atlas** with encrypted passwords (bcrypt) and JWT user sessions!
7. **Bulletproof Architecture:** Hardened with strict React **Error Boundaries** to prevent cascading dashboard failure, integrated alongside highly tailored prompt extraction logic securing Gemini's token limits natively.

---

## 🛠 Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide-React
- **Backend:** Node.js, Express.js (REST API)
- **Database:** MongoDB Atlas (Mongoose ORM)
- **AI Engine:** `@google/genai` (powered by **Gemini 2.5 Flash**) for PDF parsing and the Hero Bot.

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/thamizhan-05/HisabHero.git
cd HisabHero
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
You MUST configure the Google Gemini Large Language Model and the MongoDB Atlas Connection string for the platform to work.
1. Create a `.env` file in the root directory.
2. Add your keys securely inside:
```env
GEMINI_API_KEY="AIzaSyYourKeyHere..."
MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/hisabhero?retryWrites=true&w=majority"
PORT=5000
```

### 4. Run the Application
You can run the Frontend Vite Server and Backend Express server either concurrently, or on separate terminals.

**Start the Vite Frontend:**
```bash
npm run dev
```

**Start the Express Backend:**
```bash
npm run server
```

The frontend will be available at `http://localhost:8080` and the backend strictly binds on `http://localhost:5000`.

---

## 🤝 Hackathon Ready!
Built rapidly with precision for maximum SME value proposition, solving unstructured local banking friction with AI extraction!
