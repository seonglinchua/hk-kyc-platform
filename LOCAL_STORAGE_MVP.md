# Local Storage MVP - HK KYC Platform

This document describes the local storage implementation for the HK KYC Platform MVP.

## Overview

The application has been converted to use browser localStorage instead of backend API calls. This allows the frontend to run independently without requiring a backend server, database, or n8n integration.

## What Changed

### 1. New Files

- **`frontend/src/services/localStorage.js`**: Core local storage utility service
  - Manages all data persistence using browser localStorage
  - Provides CRUD operations for users, cases, documents, and AI summaries
  - Includes data initialization with default seed data

### 2. Modified Files

- **`frontend/src/services/api.js`**: Completely rewritten to use localStorage
  - Maintains the same API interface (authAPI, caseAPI, documentAPI)
  - All async methods still return Promises for compatibility
  - Simulates API delays for realistic UX

## Features

### Authentication
- **Login**: Use email and password to authenticate
- **Session Management**: Token and user info stored in localStorage
- **Logout**: Clears session data

### Default Users
```
Email: admin@example.com
Password: password123
Role: admin

Email: rm@example.com
Password: password123
Role: user
```

### Case Management
- **Create Cases**: Individual or corporate KYC cases
- **View Cases**: List all cases with filtering and sorting
- **Update Status**: Change case status (pending, ai_ready, in_review, approved, rejected)
- **View Details**: Full case information with documents and AI summaries

### Document Upload
- **File Storage**: Documents converted to base64 and stored in localStorage
- **Supported Types**: passport, br_cert, address_proof, screening_report, other
- **View Documents**: Display uploaded documents using base64 data URLs

### AI Analysis (Mock)
- **Trigger Analysis**: Generates mock AI summary for cases with screening reports
- **Risk Scoring**: Random risk score between 2-4
- **Summary Generation**: Creates realistic analysis text

## Seed Data

The application includes sample data to test functionality:

### Sample Cases

1. **John Doe (Individual)**
   - Case Number: KYC-2025-00001
   - Status: pending
   - Country: Hong Kong

2. **ABC Trading Limited (Corporate)**
   - Case Number: KYC-2025-00002
   - Status: in_review
   - Risk Score: 3
   - Country: Hong Kong

## Running the Application

### Frontend Only

Since the backend is no longer needed:

```bash
cd frontend
npm install
npm run dev
```

The application will run on `http://localhost:5173` (or next available port).

### Backend (Optional)

The backend is **not required** for the MVP. If you want to run the full stack in the future:

```bash
cd backend
npm install
npm run dev
```

## Data Persistence

### Storage Keys

All data is stored in localStorage with the following keys:
- `token`: Authentication token
- `user`: Current user object
- `kyc_users`: All users array
- `kyc_cases`: All cases array
- `kyc_documents`: All documents array
- `kyc_ai_summaries`: All AI summaries array

### Clearing Data

To reset the application to initial state:

```javascript
// Open browser console and run:
localStorage.clear();
// Then refresh the page
```

## Limitations

### Current Limitations

1. **Data Persistence**: Data only persists in the browser's localStorage
   - Clearing browser data will reset everything
   - Data is not shared between browsers or devices
   - Not suitable for production use

2. **File Size**: localStorage has a ~5-10MB limit
   - Large documents may cause issues
   - Consider using smaller test files

3. **Security**:
   - Passwords stored in plain text (for MVP only)
   - No real JWT tokens
   - Not secure for production

4. **AI Analysis**: Mock implementation only
   - No real document analysis
   - Generates random/generic summaries

### Browser Compatibility

Works in all modern browsers that support:
- localStorage API
- FileReader API (for file uploads)
- ES6+ JavaScript

## Reverting to Backend

To revert back to using the backend:

1. Restore the original `frontend/src/services/api.js` from git history:
   ```bash
   git checkout HEAD~1 frontend/src/services/api.js
   ```

2. Remove the localStorage service:
   ```bash
   rm frontend/src/services/localStorage.js
   ```

3. Start both backend and frontend servers

## Development Notes

### Adding New Features

When adding new features:

1. Add data models to `localStorage.js` if needed
2. Implement CRUD operations in the storage utility
3. Add API methods in `api.js` using the storage utility
4. Maintain async/Promise pattern for compatibility

### Testing

Since everything runs locally:

1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. View/edit data directly
4. Console logs show all operations

## Future Improvements

For production deployment:

1. **Backend Integration**:
   - Restore API calls to real backend
   - Implement proper authentication (JWT, OAuth)
   - Use database for persistence

2. **Real AI Analysis**:
   - Integrate with n8n workflows
   - Connect to actual AI models
   - Process real documents

3. **Security**:
   - Implement proper password hashing (bcrypt)
   - Use secure session management
   - Add CSRF protection

4. **File Handling**:
   - Use cloud storage (S3, Azure Blob)
   - Implement file encryption
   - Add virus scanning

## Support

For issues or questions:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Try clearing localStorage and refreshing
4. Check that you're using a modern browser

## License

Same as the main project.
