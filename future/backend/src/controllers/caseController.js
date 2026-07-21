import prisma from '../config/database.js';
import { triggerN8nWorkflow } from '../services/n8nService.js';

// @route   GET /api/cases
// @desc    Get all cases with filters
// @access  Private
export const getCases = async (req, res) => {
  try {
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Fetch cases
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          relationshipManager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          aiSummary: {
            select: {
              riskScore: true,
              recommendation: true
            }
          },
          _count: {
            select: {
              documents: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take
      }),
      prisma.case.count({ where })
    ]);

    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch cases' }
    });
  }
};

// @route   POST /api/cases
// @desc    Create new case
// @access  Private
export const createCase = async (req, res) => {
  try {
    const {
      clientType,
      clientName,
      dateOfBirth,
      dateOfIncorporation,
      country,
      nationality,
      businessType,
      industry,
      sourceOfWealth
    } = req.body;

    // Validate required fields
    if (!clientType || !clientName || !country) {
      return res.status(400).json({
        error: { message: 'Please provide all required fields: clientType, clientName, country' }
      });
    }

    // Create case
    const newCase = await prisma.case.create({
      data: {
        clientType,
        clientName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfIncorporation: dateOfIncorporation ? new Date(dateOfIncorporation) : null,
        country,
        nationality,
        businessType,
        industry,
        sourceOfWealth,
        status: 'pending',
        rmId: req.user.id
      },
      include: {
        relationshipManager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ case: newCase });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      error: { message: 'Failed to create case' }
    });
  }
};

// @route   GET /api/cases/:id
// @desc    Get case by ID
// @access  Private
export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        relationshipManager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: {
          orderBy: { uploadedAt: 'desc' }
        },
        aiSummary: true
      }
    });

    if (!caseData) {
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }

    res.json({ case: caseData });
  } catch (error) {
    console.error('Get case by ID error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch case' }
    });
  }
};

// @route   PUT /api/cases/:id
// @desc    Update case
// @access  Private
export const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be directly updated
    delete updateData.id;
    delete updateData.caseNumber;
    delete updateData.createdAt;
    delete updateData.rmId;

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateOfIncorporation) {
      updateData.dateOfIncorporation = new Date(updateData.dateOfIncorporation);
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        relationshipManager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: true,
        aiSummary: true
      }
    });

    res.json({ case: updatedCase });
  } catch (error) {
    console.error('Update case error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }
    res.status(500).json({
      error: { message: 'Failed to update case' }
    });
  }
};

// @route   DELETE /api/cases/:id
// @desc    Delete case
// @access  Private
export const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.case.delete({
      where: { id }
    });

    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }
    res.status(500).json({
      error: { message: 'Failed to delete case' }
    });
  }
};

// @route   PATCH /api/cases/:id/status
// @desc    Update case status
// @access  Private
export const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'ai_ready', 'in_review', 'approved', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }
      });
    }

    const updateData = { status };

    // Add approval/rejection metadata
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = req.user.id;
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = req.user.id;
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        relationshipManager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ case: updatedCase });
  } catch (error) {
    console.error('Update case status error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }
    res.status(500).json({
      error: { message: 'Failed to update case status' }
    });
  }
};

// @route   GET /api/cases/:id/summary
// @desc    Get AI summary for case
// @access  Private
export const getCaseSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const aiSummary = await prisma.aiSummary.findUnique({
      where: { caseId: id }
    });

    if (!aiSummary) {
      return res.status(404).json({
        error: { message: 'AI summary not found for this case' }
      });
    }

    res.json({ summary: aiSummary });
  } catch (error) {
    console.error('Get case summary error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch AI summary' }
    });
  }
};

// @route   POST /api/cases/:id/trigger-analysis
// @desc    Manually trigger AI analysis
// @access  Private
export const triggerAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    // Get case with documents
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        documents: {
          where: {
            documentType: 'screening_report'
          }
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }

    // Check if screening report exists
    if (caseData.documents.length === 0) {
      return res.status(400).json({
        error: { message: 'No screening report uploaded for this case' }
      });
    }

    // Trigger n8n workflow
    await triggerN8nWorkflow(caseData);

    res.json({ message: 'AI analysis triggered successfully' });
  } catch (error) {
    console.error('Trigger analysis error:', error);
    res.status(500).json({
      error: { message: 'Failed to trigger AI analysis' }
    });
  }
};
