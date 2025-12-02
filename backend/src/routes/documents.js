import express from 'express';
import {
  uploadDocument,
  getCaseDocuments,
  getDocument,
  downloadDocument,
  deleteDocument
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All document routes require authentication
router.use(authenticate);

// Document operations
router.post('/cases/:caseId/documents', upload.single('file'), uploadDocument);
router.get('/cases/:caseId/documents', getCaseDocuments);
router.get('/documents/:id', getDocument);
router.get('/documents/:id/download', downloadDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
