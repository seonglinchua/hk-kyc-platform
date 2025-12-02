# Nezha KYC Orchestrator

> AI-powered KYC (Know Your Customer) case management platform for financial institutions in Hong Kong

A streamlined KYC platform that automates client onboarding analysis using AI to read screening reports, extract insights, and provide risk assessments—helping Relationship Managers, Operations, and Compliance teams make faster, informed decisions.

---

## 🎯 What It Does (MVP Scope)

**A simple KYC Case Dashboard where users can:**
- See a list of all KYC cases
- Create new cases with client details and document uploads
- View AI-generated summaries + documents + screening reports for each case
- Set basic case status (Pending / In Review / Approved / Rejected)

**The AI Magic:**
Upload your Ingenique, Dow Jones, or Acuris screening report → Our system reads it with OCR + Ollama AI → Get instant risk scores, red flags, and recommendations.

---

## ✨ Key Features

### 1. **Case Management Dashboard**
- View all KYC cases in a searchable, filterable table
- Track case status and risk scores at a glance
- Quick access to case details with one click

### 2. **Intelligent Case Analysis**
- **Automatic OCR**: Extracts text from uploaded screening reports (PDFs/images)
- **AI Summary Generation**: Ollama-powered analysis produces:
  - Risk score (Low / Medium / High)
  - Summary paragraph
  - Red flags (sanctions hits, PEP connections, high-risk jurisdictions)
  - Missing information alerts
  - Onboarding recommendation

### 3. **Document Management**
- Secure upload and storage of:
  - Passports / ID documents
  - Business Registration certificates
  - Address proofs
  - Screening reports (Ingenique/Dow Jones/Acuris)
  - Additional supporting documents

### 4. **Workflow Automation**
- n8n workflow orchestration triggers on case creation
- Automatic document processing pipeline
- Real-time status updates

### 5. **Decision Making**
- Approve / Reject cases with one click
- Request additional information
- Export case reports (PDF)
- Audit trail of all actions

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React SPA
│   (React)       │  - Case Dashboard
└────────┬────────┘  - Case Detail Views
         │           - Document Upload
         │
    [REST API]
         │
┌────────┴────────┐
│   Backend       │  Node.js/Express
│   (Node.js)     │  - REST API
└────────┬────────┘  - File Storage
         │           - Database
         │
    [Webhook]
         │
┌────────┴────────┐
│   n8n           │  Workflow Automation
│   Workflow      │  - OCR Processing
└────────┬────────┘  - AI Orchestration
         │
         │
┌────────┴────────┐
│   Ollama        │  Local AI Model
│   (AI Engine)   │  - LLaMA 2/3
└─────────────────┘  - Document Analysis
                     - Risk Assessment
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+
- **Routing**: React Router v6
- **Styling**: Tailwind CSS / Material-UI / Ant Design (choose one)
- **State Management**: React Context / Zustand (lightweight)
- **HTTP Client**: Axios / Fetch API
- **File Upload**: react-dropzone
- **PDF Viewer**: react-pdf

### Backend
- **Runtime**: Node.js 18+ / Express
- **Database**: PostgreSQL / MongoDB
- **ORM**: Prisma / TypeORM / Mongoose
- **File Storage**: Local filesystem / AWS S3 / MinIO
- **Authentication**: JWT / Passport.js
- **API Documentation**: Swagger / OpenAPI

### AI & Automation
- **Workflow Engine**: n8n (self-hosted)
- **AI Model**: Ollama (LLaMA 2, Mistral, or LLaMA 3)
- **OCR**: Tesseract / Cloud Vision API
- **PDF Processing**: pdf-parse / pdfjs

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **Monitoring**: Prometheus + Grafana (optional)

---

## 📁 Project Structure

```
hk-kyc-platform/
├── frontend/                  # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── shared/
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   ├── FileUploadField.jsx
│   │   │   │   └── ConfirmDialog.jsx
│   │   │   ├── case/
│   │   │   │   ├── CaseTable.jsx
│   │   │   │   ├── DocumentList.jsx
│   │   │   │   └── AISummaryCard.jsx
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx
│   │   │       └── Header.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── CaseListPage.jsx
│   │   │   ├── CaseDetailPage.jsx
│   │   │   └── NewCasePage.jsx
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Node.js backend API
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   │   ├── authController.js
│   │   │   └── caseController.js
│   │   ├── models/           # Database models
│   │   │   ├── User.js
│   │   │   ├── Case.js
│   │   │   └── Document.js
│   │   ├── routes/           # API routes
│   │   │   ├── auth.js
│   │   │   └── cases.js
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.js
│   │   │   └── upload.js
│   │   ├── services/         # Business logic
│   │   │   ├── n8nService.js
│   │   │   └── fileService.js
│   │   ├── config/           # Configuration
│   │   │   └── database.js
│   │   └── server.js         # Entry point
│   ├── uploads/              # Uploaded files (local storage)
│   ├── package.json
│   └── .env.example
│
├── n8n-workflows/            # n8n workflow definitions
│   ├── kyc-analysis-workflow.json
│   └── README.md
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── docs/                     # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+ (or MongoDB 6+)
- Docker & Docker Compose
- Ollama installed locally

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/your-org/hk-kyc-platform.git
cd hk-kyc-platform
```

#### 2. Set up environment variables

**Backend (.env)**
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kyc_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kyc-analysis
N8N_API_KEY=your-n8n-api-key

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

#### 3. Install dependencies

**Backend**
```bash
cd backend
npm install
```

**Frontend**
```bash
cd frontend
npm install
```

#### 4. Set up database
```bash
cd backend
npx prisma migrate dev  # If using Prisma
# OR
npm run db:migrate      # If using custom migrations
```

#### 5. Start Ollama
```bash
ollama serve
ollama pull llama2  # or mistral, llama3
```

#### 6. Start n8n
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### 7. Start the application

**Backend**
```bash
cd backend
npm run dev  # Runs on http://localhost:3000
```

**Frontend**
```bash
cd frontend
npm run dev  # Runs on http://localhost:5173
```

#### 8. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- n8n: http://localhost:5678

---

## 📄 Pages & Features

### 🔐 1. Login Page
**Route**: `/login`

**Elements:**
- Email/Username input
- Password input
- Login button

**Flow:**
1. Enter credentials
2. Click "Login"
3. On success → redirect to Case List

### 📋 2. Case List Page
**Route**: `/` or `/cases`

**Purpose:** Main dashboard for RMs, Ops, and Compliance teams

**Table Columns:**
- Case ID
- Client Name
- Country
- Status (Pending / AI Ready / In Review / Approved / Rejected)
- Risk Score (from AI)
- Last Updated Date

**Actions:**
- "New Case" button
- Click row or "View" button → go to Case Detail Page

**Filters:**
- Search by Client Name
- Filter by Status (dropdown)
- Sort by Date/Risk Score

### 📊 3. Case Detail Page
**Route**: `/cases/:id`

**Sections:**

#### A. Header
- Client Name (large title)
- Status badge
- Action buttons:
  - Approve
  - Reject
  - Request Info
  - Export PDF (future)

#### B. Client Details Section
- Client Name
- Date of Birth / Registration
- Nationality / Country
- Business Type
- Declared Source of Wealth
- Relationship Manager name

#### C. Documents Section
**Uploaded Documents:**
- Document type (Passport / BR Cert / Address Proof / Others)
- File name
- "View" link (opens in new tab or embedded viewer)
- "Upload document" button (add more docs after creation)

#### D. Screening Report Section
- If no report: "Upload Screening Report" button
- If report exists:
  - File name + uploaded date
  - "View report" link
  - "Replace report" button

**Supported formats:** PDF, Word, Images
**Supported providers:** Ingenique, Dow Jones, Acuris

#### E. AI Summary Section
**The "Wow" Factor**

Displays:
- **AI Risk Score**: 1-5 scale (Low / Medium / High)
- **Summary**: Paragraph overview
  > "HK-based trading company with one UBO; no sanctions hits; low adverse media; moderate transaction volume expected."
- **Red Flags**: Bullet list
  - High-risk jurisdiction
  - PEP connection
  - Sanctions hit
- **Missing Information**: Bullet list
  - Source of wealth documents
  - Expected monthly turnover
- **Recommendation**: Action suggestion
  > "Proceed with onboarding as Medium Risk. Request additional documentation for Source of Wealth."

**If AI not ready:**
- Show "AI is processing this case via workflow"
- "Refresh" button to re-fetch from backend

### ➕ 4. New Case Page
**Route**: `/cases/new`

**Form Sections:**

#### Client Information
- Client Type: Individual / Corporate (dropdown)
- Client Name (text)
- Date of Birth / Incorporation (date)
- Country / Nationality (dropdown)
- Business Type / Industry (text)
- Source of Wealth (textarea)

#### Document Upload
- Passport / ID (file upload)
- BR Certificate or CI (file upload)
- Address Proof (file upload)
- Other supporting docs (multi-file upload)

#### Screening Report
- File upload for Ingenique / Dow Jones / Acuris report

**Submit Button**: "Create Case & Start Analysis"

**Flow:**
1. Fill form and upload documents
2. Click "Create Case & Start Analysis"
3. Backend saves case and triggers n8n workflow
4. Redirect to Case Detail page
5. Show banner: "Case created. AI analysis will appear once ready."

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login          # User login
POST   /api/auth/logout         # User logout
GET    /api/auth/me             # Get current user
```

### Cases
```
GET    /api/cases               # List all cases (with filters)
POST   /api/cases               # Create new case
GET    /api/cases/:id           # Get case details
PUT    /api/cases/:id           # Update case
DELETE /api/cases/:id           # Delete case
PATCH  /api/cases/:id/status    # Update case status
GET    /api/cases/:id/summary   # Get AI summary
```

### Documents
```
POST   /api/cases/:id/documents       # Upload document
GET    /api/cases/:id/documents       # List case documents
GET    /api/documents/:id             # Download document
DELETE /api/documents/:id             # Delete document
```

### Workflows
```
POST   /api/webhook/n8n               # n8n webhook endpoint
POST   /api/cases/:id/trigger-analysis # Manually trigger AI analysis
```

---

## 🤖 n8n Workflow

### KYC Analysis Workflow

**Trigger:** Webhook from backend when new case is created

**Steps:**
1. **Receive Case Data**: Get case ID and file paths
2. **Extract Screening Report**: Read PDF/image with OCR
3. **Call Ollama AI**: Send report text + prompt
4. **Parse AI Response**: Extract risk score, summary, red flags
5. **Update Case**: Save AI summary back to database via API
6. **Notify User**: (Optional) Send email/Slack notification

**Prompt Template:**
```
You are a KYC analyst. Analyze this screening report and provide:

1. Risk Score (1-5): Rate the overall risk
2. Summary: Brief overview of the client
3. Red Flags: List any concerns (sanctions, PEP, adverse media, high-risk jurisdictions)
4. Missing Information: What additional info is needed?
5. Recommendation: Should we proceed with onboarding?

Screening Report:
[OCR_TEXT_HERE]

Client Details:
- Name: [CLIENT_NAME]
- Country: [COUNTRY]
- Business: [BUSINESS_TYPE]

Respond in JSON format.
```

---

## 🧩 Component Breakdown

### Shared Components
- **StatusBadge**: Color-coded status indicator
- **FileUploadField**: Drag-and-drop file upload
- **ConfirmDialog**: Confirmation modal for actions
- **LoadingSpinner**: Loading state indicator

### Case Components
- **CaseTable**: Sortable, filterable case list
- **DocumentList**: Display uploaded documents with preview
- **AISummaryCard**: Formatted AI analysis display

### Layout Components
- **AppLayout**: Main app wrapper with header
- **Header**: Top navigation bar with user menu

---

## 🎨 Design Principles

### Keep It Simple
- **Single Role**: No complex role-based UI (RM vs Ops vs Compliance)
- **No Over-Engineering**: Simple filters, basic search, plain React state
- **Focus on Core Flow**: Create → Upload → Analyze → Decide

### What We DON'T Include in MVP
❌ Multi-tenant architecture
❌ Admin panel / Settings pages
❌ Complex permission control
❌ Multi-language support
❌ Dashboard charts and analytics
❌ Advanced search across all fields
❌ Redux or complex state management

---

## 🎬 Demo Flow

Perfect for showing HK SME prospects:

1. **Log in** to the dashboard
2. Click **"New Case"**
3. Fill simple form:
   - Client name: "ABC Trading Limited"
   - Country: Hong Kong
   - Business: Import/Export
   - Upload: Passport + BR cert + Ingenique PDF
4. Click **"Create case & Start Analysis"**
5. Redirected to Case Detail page
6. Explain: *"In the background, my system runs OCR, reads your Ingenique report, and asks a local AI (Ollama) to produce a summary."*
7. **Refresh page** → AI Summary appears:
   - Risk Score: 3 – Medium Risk
   - Summary: "HK-based trading company..."
   - Red Flags: "High transaction volume"
   - Missing Info: "Source of wealth documentation"
8. Click **"Approve"** → Status changes instantly
9. Show audit log (future feature)

**Result:** Client immediately sees the value of automated KYC analysis.

---

## 🔒 Security Considerations

- **Authentication**: JWT-based auth with httpOnly cookies
- **File Upload Validation**: Check file types, size limits, virus scanning
- **SQL Injection Prevention**: Use parameterized queries / ORM
- **XSS Protection**: Sanitize user inputs, use React's built-in escaping
- **CORS**: Configure allowed origins
- **Rate Limiting**: Prevent brute force attacks
- **HTTPS**: Use SSL in production
- **Environment Variables**: Never commit secrets to git

---

## 📦 Deployment

### Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Services:
# - Frontend: http://localhost:80
# - Backend: http://localhost:3000
# - PostgreSQL: localhost:5432
# - n8n: http://localhost:5678
# - Ollama: localhost:11434
```

### Manual Deployment

**Backend:**
```bash
cd backend
npm install --production
npm run build
pm2 start dist/server.js --name kyc-backend
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Serve 'dist' folder with Nginx
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name kyc.yourdomain.com;

    # Frontend
    location / {
        root /var/www/kyc/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📚 Documentation

- **API Documentation**: See [docs/API.md](docs/API.md)
- **Setup Guide**: See [docs/SETUP.md](docs/SETUP.md)
- **Deployment Guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **n8n Workflows**: See [n8n-workflows/README.md](n8n-workflows/README.md)

---

## 🛣️ Roadmap

### Phase 1: MVP (Current)
- ✅ Basic case management
- ✅ Document upload
- ✅ AI-powered screening report analysis
- ✅ Approve/Reject workflow

### Phase 2: Enhanced Features
- 🔲 Multi-user roles (RM / Ops / Compliance)
- 🔲 Advanced search and filters
- 🔲 Audit trail and activity logs
- 🔲 Email notifications
- 🔲 Bulk case import

### Phase 3: Enterprise
- 🔲 Multi-tenant architecture
- 🔲 Advanced analytics dashboard
- 🔲 Custom workflow builder
- 🔲 Integration with core banking systems
- 🔲 Mobile app

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ollama**: Local AI model inference
- **n8n**: Workflow automation platform
- **React**: Frontend framework
- **Node.js**: Backend runtime

---

## 📞 Support

For questions or support:
- Email: support@nezha-kyc.com
- Documentation: https://docs.nezha-kyc.com
- Issues: https://github.com/your-org/hk-kyc-platform/issues

---

**Built with ❤️ for Hong Kong financial institutions**
