\# CollabMind\
\
\*\*AI-powered research collaboration platform\*\* — upload documents, chat with them using RAG, take shared notes, manage tasks, and run structured AI-assisted debates, all in one workspace.\
\
🔗 \*\*Live demo:\*\* [collabmind-five.vercel.app]\(https\://collabmind-five.vercel.app)\
\
\> Note: the backend runs on a free-tier host that spins down after inactivity — the first request after idle time may take 30–60 seconds to respond.\
\
\---\
\
\## Overview\
\
CollabMind is a full-stack MERN application built for research teams to collaborate around shared documents. Members can upload PDFs, ask natural-language questions grounded in those documents (RAG), co-write notes, track tasks, and hold structured debates where an AI can summarize arguments, generate counter-points, or argue a position as its own participant.\
\
\---\
\
\## Screenshots\
\
\### Login\
![Login]\(./Screenshots_CM/Login.png)\
\
\### Sign Up\
![Sign Up]\(./Screenshots_CM/SignUP.png)\
\
\### Workspace Dashboard\
![Dashboard]\(./Screenshots_CM/dashboard.png)\
\
\### Inviting Members\
![Invite Member]\(./Screenshots_CM/invite_member.png)\
\
\### AI-Grounded Document Chat\
![Chat]\(./Screenshots_CM/chat.png)\
\
\### Shared Notes\
![Notes]\(./Screenshots_CM/notes.png)\
\
\### AI-Assisted Debates\
![Debate]\(./Screenshots_CM/debate.png)\
\
\---\
\
\## Features\
\
\### Authentication & Workspaces\
\- Signup flow with email verification: enter email → receive a one-time 6-digit code → verify → set name and password\
\- Password requirements enforced on both frontend and backend (minimum 8 characters, at least 1 symbol)\
\- Login with email + password (no OTP required after the account is created)\
\- Create workspaces, invite teammates by email with an explicit accept/decline flow\
\- Role-based membership (admin / member)\
\- Admin-only workspace deletion, with full cascade cleanup of related documents, notes, tasks, debates, and memberships\
\
\### Document Intelligence (RAG)\
\- Upload PDF documents to a workspace\
\- Automatic text extraction, chunking, and embedding generation\
\- Ask questions grounded in uploaded documents — answers cite the specific source passages used\
\- Documents stored permanently in Cloudinary (not on local/ephemeral server disk)\
\
\### Shared Notes\
\- One collaborative notes document per workspace\
\- Owner-controlled edit permissions (all members / selected members / owner only)\
\- Export notes as a formatted PDF\
\
\### Task Management\
\- Create, track, and update tasks within a workspace\
\
\### AI-Assisted Debates\
\- Multiple structured debate topics per workspace\
\- For / Against / Neutral comments with upvoting\
\- AI capabilities (each with an optional "ground in documents" toggle):\
&#x20; \- Generate a counter-argument to any comment\
&#x20; \- Summarize the debate fairly, covering both sides\
&#x20; \- Have the AI argue a position as its own participant\
&#x20; \- Suggest debate topics based on workspace context\
\
\### Markdown Rendering\
AI-generated responses in chat and debates render as properly formatted text (bold, lists, code) instead of raw markdown symbols.\
\
\---\
\
\## Tech Stack\
\
\*\*Frontend\*\*\
\- React (Vite)\
\- React Router (with protected routes for authenticated pages)\
\- Tailwind CSS v4\
\- Axios\
\- react-markdown\
\- Lucide icons\
\
\*\*Backend\*\*\
\- Node.js + Express\
\- Mongoose (MongoDB ODM)\
\- JWT authentication + bcrypt password hashing\
\- Nodemailer (Gmail SMTP) — OTP email delivery\
\- Multer (in-memory file handling)\
\- pdf-parse (PDF text extraction)\
\- pdfkit (PDF generation for notes export)\
\
\*\*AI\*\*\
\- Google Gemini API\
&#x20; \- \`gemini-embedding-001\` — document embeddings\
&#x20; \- \`gemini-2.5-flash\` — chat answers, debate summaries, AI-generated arguments\
\- Custom-built RAG retrieval pipeline (cosine similarity search over stored embeddings)\
\
\*\*Database & Storage\*\*\
\- MongoDB Atlas (cloud-hosted database)\
\- Cloudinary (permanent cloud storage for uploaded documents)\
\
\*\*Hosting\*\*\
\- Backend: [Render]\(https\://render.com)\
\- Frontend: [Vercel]\(https\://vercel.com)\
\- Both connected to GitHub for automatic redeployment on every push\
\
\---\
\
\## Project Structure\
\
\`\`\`\
collabmind/\
├── irc-backend/          # Express API server\
│   ├── config/            # Third-party service configuration (Cloudinary)\
│   ├── middleware/         # Auth guard, file upload handling\
│   ├── models/              # Mongoose schemas\
│   ├── routes/               # API route handlers\
│   ├── scripts/               # One-off maintenance scripts\
│   ├── utils/                  # Embeddings, text processing, similarity scoring, email\
│   └── index.js                 # App entry point\
│\
└── irc-frontend/          # React (Vite) client\
&#x20;   └── src/\
&#x20;       ├── api/            # Axios client\
&#x20;       ├── components/      # Reusable UI components, ProtectedRoute\
&#x20;       ├── context/           # Auth context/provider\
&#x20;       ├── Layouts/            # Page layout wrapper\
&#x20;       └── Pages/               # Route-level pages\
\`\`\`\
\
\---\
\
\## Running Locally\
\
\### Prerequisites\
\- Node.js\
\- A MongoDB Atlas connection string (or local MongoDB)\
\- A Google Gemini API key\
\- A Cloudinary account (cloud name, API key, API secret)\
\- A Gmail account with an App Password (for sending OTP emails)\
\
\### Backend setup\
\
\`\`\`bash\
cd irc-backend\
npm install\
\`\`\`\
\
Create \`irc-backend/.env\`:\
\
\`\`\`\
MONGO_URI=your_mongodb_connection_string\
JWT_SECRET=your_random_secret_string\
GEMINI_API_KEY=your_gemini_api_key\
CLOUDINARY_CLOUD_NAME=your_cloud_name\
CLOUDINARY_API_KEY=your_api_key\
CLOUDINARY_API_SECRET=your_api_secret\
GMAIL_USER=your_gmail_address\
GMAIL_APP_PASSWORD=your_16_character_app_password\
\`\`\`\
\
\`\`\`bash\
npm run dev\
\`\`\`\
\
\### Frontend setup\
\
\`\`\`bash\
cd irc-frontend\
npm install\
\`\`\`\
\
Create \`irc-frontend/.env\`:\
\
\`\`\`\
VITE_API_URL=http\://localhost:5000/api\
\`\`\`\
\
\`\`\`bash\
npm run dev\
\`\`\`\
\
The app will be available at \`http\://localhost:5173\`.\
\
\---\
\
\## Deployment Notes\
\
\- Backend (Render) and frontend (Vercel) are deployed as separate services from the same GitHub monorepo, each using its respective subfolder as the \*\*Root Directory\*\*.\
\- Environment variables are configured on the hosting platforms and are not committed to GitHub.\
\- Backend CORS allows the deployed frontend and \`localhost\` for development.\
\- Signup verification emails use \*\*Brevo's HTTPS API\*\* because Gmail SMTP timed out on the backend host.\
\- Brevo API keys are stored securely as environment variables. IP restrictions are disabled because the host's outbound IP can change.\
\- File imports are case-sensitive on the Linux-based deployment environment, which can cause builds to fail even when they work locally on Windows.\
\
\---\
\
\## Known Limitations\
\
\- Verification emails use a verified Gmail sender instead of a branded domain and are subject to Brevo's free-tier limits.\
\- Gemini API usage is limited by its free tier.\
\- MongoDB Atlas free tier has limited storage and may pause after inactivity.\
\- Backend free-tier hosting may take \*\*30–60 seconds\*\* to respond after inactivity.\
\- Password reset and full account deletion are not implemented yet.\
\- Documents cannot be renamed or individually deleted. Workspace deletion removes database records, but associated PDFs remain in Cloudinary.\
\




so givee evrythign i could replace it with
