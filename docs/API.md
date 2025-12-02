# API Documentation - Nezha KYC Orchestrator

Base URL: `http://localhost:3000/api`

All API requests (except authentication endpoints) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Authentication

### Login

**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user",
    "name": "John Doe",
    "role": "user"
  }
}
```

### Register

**POST** `/auth/register`

Request:
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "name": "New User"
}
```

Response: Same as login

### Get Current User

**GET** `/auth/me`

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Cases

### List Cases

**GET** `/cases`

Query Parameters:
- `search` (optional): Search by client name or case number
- `status` (optional): Filter by status (pending, ai_ready, in_review, approved, rejected)
- `sortBy` (optional): Sort field (createdAt, clientName, riskScore)
- `sortOrder` (optional): Sort order (asc, desc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

Example: `GET /cases?status=pending&sortBy=createdAt&sortOrder=desc`

Response:
```json
{
  "cases": [
    {
      "id": "uuid",
      "caseNumber": "ckl123456",
      "clientName": "ABC Trading Limited",
      "country": "Hong Kong",
      "status": "ai_ready",
      "riskScore": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "relationshipManager": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "aiSummary": {
        "riskScore": 3,
        "recommendation": "Proceed with caution"
      },
      "_count": {
        "documents": 4
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Case by ID

**GET** `/cases/:id`

Response:
```json
{
  "case": {
    "id": "uuid",
    "caseNumber": "ckl123456",
    "clientType": "corporate",
    "clientName": "ABC Trading Limited",
    "dateOfIncorporation": "2020-01-01T00:00:00.000Z",
    "country": "Hong Kong",
    "businessType": "Trading",
    "industry": "Import/Export",
    "sourceOfWealth": "Business profits from trading",
    "status": "ai_ready",
    "riskScore": 3,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "relationshipManager": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "documents": [
      {
        "id": "uuid",
        "documentType": "br_cert",
        "fileName": "business-registration.pdf",
        "filePath": "/uploads/...",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "aiSummary": {
      "id": "uuid",
      "riskScore": 3,
      "summary": "HK-based trading company with clean record...",
      "redFlags": ["High transaction volume"],
      "missingInfo": ["Source of wealth documentation"],
      "recommendation": "Proceed with medium risk classification",
      "processedAt": "2024-01-01T00:00:00.000Z",
      "modelUsed": "llama2"
    }
  }
}
```

### Create Case

**POST** `/cases`

Request:
```json
{
  "clientType": "corporate",
  "clientName": "ABC Trading Limited",
  "dateOfIncorporation": "2020-01-01",
  "country": "Hong Kong",
  "nationality": "Hong Kong",
  "businessType": "Trading",
  "industry": "Import/Export",
  "sourceOfWealth": "Business profits"
}
```

Response:
```json
{
  "case": {
    "id": "uuid",
    "caseNumber": "ckl123456",
    "clientName": "ABC Trading Limited",
    "status": "pending",
    ...
  }
}
```

### Update Case

**PUT** `/cases/:id`

Request: Same as Create Case (all fields optional)

Response: Same as Get Case by ID

### Update Case Status

**PATCH** `/cases/:id/status`

Request:
```json
{
  "status": "approved"
}
```

Valid statuses: `pending`, `ai_ready`, `in_review`, `approved`, `rejected`

Response:
```json
{
  "case": {
    "id": "uuid",
    "status": "approved",
    "approvedAt": "2024-01-01T00:00:00.000Z",
    "approvedBy": "uuid",
    ...
  }
}
```

### Get AI Summary

**GET** `/cases/:id/summary`

Response:
```json
{
  "summary": {
    "id": "uuid",
    "riskScore": 3,
    "summary": "Analysis summary...",
    "redFlags": [...],
    "missingInfo": [...],
    "recommendation": "...",
    "processedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Trigger AI Analysis

**POST** `/cases/:id/trigger-analysis`

Manually triggers the n8n workflow to analyze the case.

Response:
```json
{
  "message": "AI analysis triggered successfully"
}
```

### Delete Case

**DELETE** `/cases/:id`

Response:
```json
{
  "message": "Case deleted successfully"
}
```

## Documents

### Upload Document

**POST** `/documents/cases/:caseId/documents`

Content-Type: `multipart/form-data`

Form Data:
- `file`: The file to upload
- `documentType`: One of: `passport`, `br_cert`, `address_proof`, `screening_report`, `other`

Response:
```json
{
  "document": {
    "id": "uuid",
    "documentType": "screening_report",
    "fileName": "ingenique-report.pdf",
    "filePath": "/uploads/...",
    "fileSize": 2048000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "caseId": "uuid"
  }
}
```

Note: If `documentType` is `screening_report`, this will automatically trigger the AI analysis workflow.

### List Case Documents

**GET** `/documents/cases/:caseId/documents`

Response:
```json
{
  "documents": [
    {
      "id": "uuid",
      "documentType": "passport",
      "fileName": "passport.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### View/Download Document

**GET** `/documents/documents/:id`

Returns the file with appropriate content type.

Query parameter:
- Add `?download=true` to force download instead of inline viewing

### Delete Document

**DELETE** `/documents/documents/:id`

Response:
```json
{
  "message": "Document deleted successfully"
}
```

## Webhooks

### n8n Webhook (Internal)

**POST** `/webhook/n8n`

Used by n8n to send AI analysis results back to the backend.

Headers:
- `X-API-Key`: Your N8N_API_KEY

Request:
```json
{
  "caseId": "uuid",
  "riskScore": 3,
  "summary": "Analysis summary...",
  "redFlags": ["High risk jurisdiction"],
  "missingInfo": ["Additional documentation needed"],
  "recommendation": "Proceed with caution",
  "processingTime": 5000,
  "modelUsed": "llama2"
}
```

Response:
```json
{
  "message": "AI summary received and processed successfully",
  "summary": {...}
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error message here"
  }
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

If you exceed the limit, you'll receive a `429 Too Many Requests` response.

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get cases (replace TOKEN with your JWT)
curl -X GET http://localhost:3000/api/cases \
  -H "Authorization: Bearer TOKEN"

# Upload document
curl -X POST http://localhost:3000/api/documents/cases/CASE_ID/documents \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "documentType=screening_report"
```

### Using Postman

1. Import the API endpoints
2. Set up an environment variable for the JWT token
3. Add Authorization header: `Bearer {{token}}`

## WebSocket Support

Currently not implemented. Future versions may include WebSocket support for real-time updates on case status changes and AI analysis completion.
