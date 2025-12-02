import axios from 'axios';

/**
 * Trigger n8n workflow for KYC analysis
 * @param {Object} caseData - Case data with documents
 */
export const triggerN8nWorkflow = async (caseData) => {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.warn('N8N_WEBHOOK_URL not configured, skipping workflow trigger');
      return;
    }

    // Find screening report
    const screeningReport = caseData.documents?.find(
      doc => doc.documentType === 'screening_report'
    );

    if (!screeningReport) {
      console.warn('No screening report found, skipping workflow trigger');
      return;
    }

    // Prepare payload for n8n
    const payload = {
      caseId: caseData.id,
      caseNumber: caseData.caseNumber,
      clientName: caseData.clientName,
      clientType: caseData.clientType,
      country: caseData.country,
      businessType: caseData.businessType,
      industry: caseData.industry,
      sourceOfWealth: caseData.sourceOfWealth,
      screeningReport: {
        id: screeningReport.id,
        fileName: screeningReport.fileName,
        filePath: screeningReport.filePath,
        mimeType: screeningReport.mimeType
      }
    };

    // Send webhook to n8n
    const response = await axios.post(n8nWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && {
          'X-API-Key': process.env.N8N_API_KEY
        })
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('n8n workflow triggered successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to trigger n8n workflow:', error.message);
    throw new Error('Failed to trigger AI analysis workflow');
  }
};

/**
 * Update case with AI summary (called by n8n webhook)
 * @param {string} caseId - Case ID
 * @param {Object} summaryData - AI summary data
 */
export const updateCaseWithAISummary = async (caseId, summaryData) => {
  try {
    // This function will be called from the webhook controller
    // when n8n sends back the analysis results
    return summaryData;
  } catch (error) {
    console.error('Failed to update case with AI summary:', error);
    throw error;
  }
};
