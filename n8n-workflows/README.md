# n8n Workflows for KYC Analysis

This directory contains n8n workflow configurations for automating KYC analysis using AI.

## Workflows

### KYC Analysis Workflow (`kyc-analysis-workflow.json`)

This workflow is triggered when a new screening report is uploaded to a case. It performs the following steps:

1. **Webhook Trigger**: Receives case data from the backend API
2. **Read PDF File**: Reads the screening report file from disk
3. **Extract Text (OCR)**: Extracts text from the PDF using OCR
4. **Ollama AI Analysis**: Sends the extracted text to Ollama for analysis
5. **Parse AI Response**: Parses the AI response into structured data
6. **Send to Backend**: Sends the analysis results back to the backend API
7. **Respond to Webhook**: Returns success response

## Setup Instructions

### 1. Start n8n

Using Docker:

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v /home/user/hk-kyc-platform/backend/uploads:/data/uploads \
  --network host \
  n8nio/n8n
```

### 2. Access n8n UI

Open your browser and navigate to: `http://localhost:5678`

### 3. Import Workflow

1. Click on "Workflows" in the left sidebar
2. Click "Import from File"
3. Select `kyc-analysis-workflow.json`
4. Click "Import"

### 4. Configure Environment Variables

In n8n settings, configure the following environment variables:

- `OLLAMA_MODEL`: The Ollama model to use (e.g., `llama2`, `mistral`, `llama3`)
- `BACKEND_URL`: Your backend API URL (e.g., `http://localhost:3000`)

### 5. Configure Authentication

For the "Send to Backend" node:

1. Click on the node
2. Add credentials for "HTTP Header Auth"
3. Set header name: `X-API-Key`
4. Set header value: Your N8N_API_KEY from backend `.env`

### 6. Activate Workflow

Click the "Active" toggle in the top right to enable the workflow.

### 7. Get Webhook URL

The webhook URL will be displayed in the Webhook node. It should look like:

```
http://localhost:5678/webhook/kyc-analysis
```

Copy this URL and set it as `N8N_WEBHOOK_URL` in your backend `.env` file.

## Testing the Workflow

### Manual Testing

1. Click "Execute Workflow" button
2. Click on the Webhook node
3. Click "Listen for Test Event"
4. Send a test request from your backend or use curl:

```bash
curl -X POST http://localhost:5678/webhook/kyc-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "test-case-id",
    "clientName": "Test Client",
    "country": "Hong Kong",
    "businessType": "Trading",
    "screeningReport": {
      "filePath": "/path/to/screening-report.pdf"
    }
  }'
```

## Workflow Customization

### Adjusting AI Prompt

Edit the "Ollama AI Analysis" node to customize the prompt sent to the AI model. The current prompt asks for:

- Risk score (1-5)
- Summary paragraph
- Red flags
- Missing information
- Recommendation

### Adding Additional Processing

You can add more nodes to the workflow:

- **Email Notification**: Send email when analysis is complete
- **Slack Notification**: Post message to Slack channel
- **Additional Validation**: Add business logic to validate results
- **Data Enrichment**: Fetch additional data from external APIs

## Troubleshooting

### Ollama Not Found

Ensure Ollama is running and accessible:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

### Webhook Not Receiving Requests

- Check that the webhook URL in backend `.env` matches the n8n webhook URL
- Ensure n8n is running and the workflow is active
- Check n8n logs for errors: `docker logs n8n`

### OCR Extraction Failing

The workflow requires PDF text extraction capabilities. Ensure:

- PDF files contain extractable text (not scanned images)
- For scanned PDFs, you may need to add Tesseract OCR integration

### Backend Connection Failing

- Verify `BACKEND_URL` environment variable is correct
- Check API key authentication is properly configured
- Ensure backend is running and accessible from n8n container

## Alternative: Simplified Workflow (No OCR)

If you want to test without OCR, create a simplified version:

1. Skip the "Read PDF File" and "Extract Text" nodes
2. Modify the Ollama prompt to use only the structured client data
3. This is useful for initial testing before setting up full OCR

## Production Considerations

1. **Error Handling**: Add error handling nodes to catch and log failures
2. **Retry Logic**: Configure retry settings for API calls
3. **Monitoring**: Set up n8n to send alerts on workflow failures
4. **Scaling**: For high volume, consider running multiple n8n instances
5. **Security**: Use proper authentication and encrypt sensitive data
6. **Logging**: Enable detailed logging for debugging

## References

- [n8n Documentation](https://docs.n8n.io/)
- [Ollama Documentation](https://ollama.ai/docs)
- [n8n Workflow Examples](https://n8n.io/workflows)
