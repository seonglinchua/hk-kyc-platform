import prisma from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { triggerN8nWorkflow } from '../services/n8nService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @route   POST /api/cases/:caseId/documents
// @desc    Upload document for a case
// @access  Private
export const uploadDocument = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { documentType } = req.body;

    // Validate case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId }
    });

    if (!caseExists) {
      // Delete uploaded file if case doesn't exist
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        error: { message: 'Case not found' }
      });
    }

    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No file uploaded' }
      });
    }

    // Validate document type
    const validTypes = ['passport', 'br_cert', 'address_proof', 'screening_report', 'other'];
    if (!documentType || !validTypes.includes(documentType)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: { message: `Invalid document type. Must be one of: ${validTypes.join(', ')}` }
      });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caseId
      }
    });

    // If screening report, trigger AI analysis
    if (documentType === 'screening_report') {
      try {
        const caseData = await prisma.case.findUnique({
          where: { id: caseId },
          include: { documents: true }
        });
        await triggerN8nWorkflow(caseData);
      } catch (error) {
        console.error('Failed to trigger AI analysis:', error);
        // Don't fail the upload if workflow trigger fails
      }
    }

    res.status(201).json({ document });
  } catch (error) {
    console.error('Upload document error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: { message: 'Failed to upload document' }
    });
  }
};

// @route   GET /api/cases/:caseId/documents
// @desc    Get all documents for a case
// @access  Private
export const getCaseDocuments = async (req, res) => {
  try {
    const { caseId } = req.params;

    const documents = await prisma.document.findMany({
      where: { caseId },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get case documents error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch documents' }
    });
  }
};

// @route   GET /api/documents/:id
// @desc    Download/view document
// @access  Private
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        error: { message: 'Document not found' }
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        error: { message: 'File not found on server' }
      });
    }

    // Set headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);

    // Stream file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve document' }
    });
  }
};

// @route   GET /api/documents/:id/download
// @desc    Download document (force download)
// @access  Private
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        error: { message: 'Document not found' }
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        error: { message: 'File not found on server' }
      });
    }

    // Force download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

    // Stream file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      error: { message: 'Failed to download document' }
    });
  }
};

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        error: { message: 'Document not found' }
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete document' }
    });
  }
};
