import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// @route   POST /api/webhook/n8n
// @desc    Receive AI analysis results from n8n
// @access  Public (should be secured with API key in production)
router.post('/n8n', async (req, res) => {
  try {
    // Verify API key if configured
    if (process.env.N8N_API_KEY) {
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== process.env.N8N_API_KEY) {
        return res.status(401).json({
          error: { message: 'Unauthorized' }
        });
      }
    }

    const {
      caseId,
      riskScore,
      summary,
      redFlags,
      missingInfo,
      recommendation,
      processingTime,
      modelUsed
    } = req.body;

    // Validate required fields
    if (!caseId || !riskScore || !summary || !recommendation) {
      return res.status(400).json({
        error: { message: 'Missing required fields: caseId, riskScore, summary, recommendation' }
      });
    }

    // Check if case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId }
    });

    if (!caseExists) {
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }

    // Create or update AI summary
    const aiSummary = await prisma.aiSummary.upsert({
      where: { caseId },
      create: {
        caseId,
        riskScore: parseInt(riskScore),
        summary,
        redFlags: redFlags || [],
        missingInfo: missingInfo || [],
        recommendation,
        processingTime,
        modelUsed
      },
      update: {
        riskScore: parseInt(riskScore),
        summary,
        redFlags: redFlags || [],
        missingInfo: missingInfo || [],
        recommendation,
        processingTime,
        modelUsed,
        processedAt: new Date()
      }
    });

    // Update case status and risk score
    await prisma.case.update({
      where: { id: caseId },
      data: {
        status: 'ai_ready',
        riskScore: parseInt(riskScore)
      }
    });

    console.log(`AI summary updated for case ${caseId}`);

    res.json({
      message: 'AI summary received and processed successfully',
      summary: aiSummary
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: { message: 'Failed to process webhook' }
    });
  }
});

export default router;
