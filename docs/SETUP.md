# Setup Guide - Nezha KYC Orchestrator

This guide will help you set up the Nezha KYC Orchestrator on your local machine or server.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** or **yarn**
- **PostgreSQL** 14 or higher
- **Docker** and **Docker Compose** (recommended)
- **Ollama** (for AI functionality)
- **Git**

## Option 1: Docker Setup (Recommended)

The easiest way to get started is using Docker Compose, which will set up all services automatically.

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/hk-kyc-platform.git
cd hk-kyc-platform
```

### Step 2: Configure Environment Variables

Create `.env` files from the examples:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and update the following values:

```env
JWT_SECRET=your-secure-random-secret-key
N8N_API_KEY=your-secure-n8n-api-key
```

### Step 3: Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Backend API
- Frontend
- n8n workflow automation
- Ollama AI engine

### Step 4: Initialize Database

```bash
# Run Prisma migrations
docker exec -it kyc-backend npx prisma migrate deploy

# Seed database with initial user (optional)
docker exec -it kyc-backend npm run db:seed
```

### Step 5: Pull Ollama Model

```bash
# Pull the LLaMA 2 model (or your preferred model)
docker exec -it kyc-ollama ollama pull llama2
```

### Step 6: Import n8n Workflow

1. Open n8n: `http://localhost:5678`
2. Login with username: `admin`, password: `admin`
3. Go to Workflows → Import from File
4. Import `n8n-workflows/kyc-analysis-workflow.json`
5. Configure the workflow environment variables
6. Activate the workflow

### Step 7: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **n8n**: http://localhost:5678
- **PostgreSQL**: localhost:5432

Default login credentials:
- Email: `admin@example.com`
- Password: `password`

(Change these in production!)

## Option 2: Manual Setup

If you prefer to run services individually without Docker:

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/hk-kyc-platform.git
cd hk-kyc-platform
```

### Step 2: Set Up PostgreSQL

Create a database:

```bash
psql -U postgres
CREATE DATABASE kyc_db;
CREATE USER kyc_user WITH PASSWORD 'kyc_password';
GRANT ALL PRIVILEGES ON DATABASE kyc_db TO kyc_user;
\q
```

### Step 3: Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npm run db:seed

# Start backend
npm run dev
```

Backend will run on `http://localhost:3000`

### Step 4: Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### Step 5: Set Up Ollama

Install Ollama from https://ollama.ai/download

```bash
# Start Ollama
ollama serve

# Pull model
ollama pull llama2
```

### Step 6: Set Up n8n

Using Docker (recommended):

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/backend/uploads:/data/uploads \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=admin \
  n8nio/n8n
```

Or install globally:

```bash
npm install -g n8n
n8n
```

Then import the workflow from `n8n-workflows/kyc-analysis-workflow.json`

## Database Seeding

To create a test user and some sample data:

```bash
cd backend
npm run db:seed
```

This will create:
- Admin user: `admin@example.com` / `password`
- Sample KYC cases

## Verification

After setup, verify everything is working:

### 1. Check Backend Health

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 2. Check Database Connection

```bash
cd backend
npx prisma studio
```

This opens a GUI to browse your database.

### 3. Check Ollama

```bash
curl http://localhost:11434/api/tags
```

Should list available models.

### 4. Check n8n

Open `http://localhost:5678` and verify the workflow is imported and active.

### 5. Test Frontend

Open `http://localhost:5173` and try logging in with the default credentials.

## Creating Your First Case

1. Login to the application
2. Click "New Case"
3. Fill in client details
4. Upload a screening report (PDF)
5. Click "Create Case & Start Analysis"
6. Wait a few moments for AI analysis
7. View the AI-generated summary on the case detail page

## Troubleshooting

### Backend Won't Start

**Error: Cannot connect to database**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` is correct
- Check database credentials

**Error: Port 3000 already in use**
- Change PORT in `.env` to another port
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

### Frontend Won't Start

**Error: Port 5173 already in use**
- Change port in `vite.config.js`
- Or kill the process: `lsof -ti:5173 | xargs kill`

**Error: API calls failing**
- Check VITE_API_URL in frontend `.env`
- Verify backend is running
- Check CORS settings in backend

### n8n Workflow Not Working

**Webhook not receiving requests**
- Verify N8N_WEBHOOK_URL in backend `.env` matches n8n webhook URL
- Check n8n is running and workflow is active
- View n8n execution logs for errors

**Ollama not responding**
- Check Ollama is running: `ollama list`
- Verify OLLAMA_URL is correct
- Pull the model if not done: `ollama pull llama2`

**OCR failing**
- Ensure uploaded PDFs contain extractable text
- For scanned documents, you may need additional OCR setup

### Docker Issues

**Container won't start**
```bash
# View logs
docker-compose logs [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild
docker-compose up -d --build
```

**Database migration failed**
```bash
# Reset database (WARNING: loses all data)
docker-compose down -v
docker-compose up -d
docker exec -it kyc-backend npx prisma migrate deploy
```

## Security Considerations

### Before Deploying to Production

1. **Change default credentials**
   - Update JWT_SECRET
   - Change default user passwords
   - Update n8n admin credentials

2. **Enable HTTPS**
   - Use SSL certificates
   - Configure reverse proxy (Nginx)

3. **Configure CORS**
   - Set proper FRONTEND_URL in backend
   - Restrict allowed origins

4. **Environment Variables**
   - Never commit `.env` files
   - Use secure password generation
   - Rotate secrets regularly

5. **Database Security**
   - Use strong PostgreSQL password
   - Enable SSL for database connections
   - Regular backups

6. **File Upload Security**
   - Configure virus scanning
   - Set proper file size limits
   - Validate file types

## Next Steps

- Read [API Documentation](API.md)
- Learn about [Deployment](DEPLOYMENT.md)
- Customize the n8n workflow
- Configure additional security measures
- Set up monitoring and logging

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/your-org/hk-kyc-platform/issues)
- Review the main [README](../README.md)
- Contact support: support@nezha-kyc.com
