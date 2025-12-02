// Local Storage API - Replaces backend API calls with localStorage operations
import {
  initializeStorage,
  userStorage,
  caseStorage,
  documentStorage,
  aiSummaryStorage,
  sessionStorage,
} from './localStorage';

// Initialize storage on module load
initializeStorage();

// Simple password comparison (in real app, use bcrypt)
// For MVP, we'll just compare plain text passwords
const comparePasswords = (inputPassword, storedPassword) => {
  // For MVP simplicity, we'll use plain text comparison
  return inputPassword === storedPassword;
};

// Generate a simple token (in real app, use JWT)
const generateToken = (userId) => {
  return btoa(`${userId}:${Date.now()}`);
};

// Simulate async API calls with delays
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authAPI = {
  login: async (email, password) => {
    await delay(300);

    const user = userStorage.getByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!comparePasswords(password, user.password)) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  },

  register: async (userData) => {
    await delay(300);

    // Check if email already exists
    const existingUser = userStorage.getByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Create new user
    const newUser = userStorage.create({
      ...userData,
      role: 'user',
    });

    // Generate token
    const token = generateToken(newUser.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      token,
      user: userWithoutPassword,
    };
  },

  getCurrentUser: async () => {
    await delay(100);

    const user = sessionStorage.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    return { user };
  },

  logout: () => {
    sessionStorage.clearSession();
    window.location.href = '/login';
  },
};

// Case API
export const caseAPI = {
  getCases: async (params = {}) => {
    await delay(200);

    const currentUser = sessionStorage.getUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const cases = caseStorage.getAll(params);

    // Enrich cases with related data
    const enrichedCases = cases.map((caseItem) => {
      // Get relationship manager
      const relationshipManager = caseItem.rmId
        ? userStorage.getById(caseItem.rmId)
        : null;

      // Get documents count
      const documents = documentStorage.getByCaseId(caseItem.id);

      // Get AI summary
      const aiSummary = aiSummaryStorage.getByCaseId(caseItem.id);

      return {
        ...caseItem,
        relationshipManager: relationshipManager
          ? {
              id: relationshipManager.id,
              name: relationshipManager.name,
              email: relationshipManager.email,
            }
          : null,
        _count: {
          documents: documents.length,
        },
        aiSummary: aiSummary || null,
      };
    });

    return {
      cases: enrichedCases,
      total: enrichedCases.length,
      page: parseInt(params.page) || 1,
      limit: parseInt(params.limit) || 10,
    };
  },

  getCaseById: async (id) => {
    await delay(200);

    const caseItem = caseStorage.getById(id);
    if (!caseItem) {
      throw new Error('Case not found');
    }

    // Get relationship manager
    const relationshipManager = caseItem.rmId
      ? userStorage.getById(caseItem.rmId)
      : null;

    // Get documents
    const documents = documentStorage.getByCaseId(id);

    // Get AI summary
    const aiSummary = aiSummaryStorage.getByCaseId(id);

    return {
      ...caseItem,
      relationshipManager: relationshipManager
        ? {
            id: relationshipManager.id,
            name: relationshipManager.name,
            email: relationshipManager.email,
          }
        : null,
      documents,
      aiSummary: aiSummary || null,
    };
  },

  createCase: async (caseData) => {
    await delay(300);

    const currentUser = sessionStorage.getUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    // Create case with current user as RM
    const newCase = caseStorage.create({
      ...caseData,
      rmId: currentUser.id,
    });

    // Get relationship manager info
    const relationshipManager = userStorage.getById(currentUser.id);

    return {
      ...newCase,
      relationshipManager: relationshipManager
        ? {
            id: relationshipManager.id,
            name: relationshipManager.name,
            email: relationshipManager.email,
          }
        : null,
      documents: [],
      aiSummary: null,
    };
  },

  updateCase: async (id, caseData) => {
    await delay(300);

    const updatedCase = caseStorage.update(id, caseData);
    if (!updatedCase) {
      throw new Error('Case not found');
    }

    return updatedCase;
  },

  deleteCase: async (id) => {
    await delay(300);

    caseStorage.delete(id);
    return { message: 'Case deleted successfully' };
  },

  updateCaseStatus: async (id, status) => {
    await delay(300);

    const currentUser = sessionStorage.getUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const updatedCase = caseStorage.updateStatus(id, status, currentUser.id);
    if (!updatedCase) {
      throw new Error('Case not found');
    }

    return updatedCase;
  },

  getCaseSummary: async (id) => {
    await delay(200);

    const aiSummary = aiSummaryStorage.getByCaseId(id);
    if (!aiSummary) {
      throw new Error('AI summary not found');
    }

    return aiSummary;
  },

  triggerAnalysis: async (id) => {
    await delay(500);

    const caseItem = caseStorage.getById(id);
    if (!caseItem) {
      throw new Error('Case not found');
    }

    // Check if screening report exists
    const documents = documentStorage.getByCaseId(id);
    const screeningReport = documents.find(
      (doc) => doc.documentType === 'screening_report'
    );

    if (!screeningReport) {
      throw new Error('Screening report not uploaded yet');
    }

    // Generate mock AI summary
    const mockSummary = {
      caseId: id,
      riskScore: Math.floor(Math.random() * 3) + 2, // Random score between 2-4
      summary: `Analysis completed for ${caseItem.clientName}. The client profile has been reviewed based on provided documentation and screening reports.`,
      redFlags: [
        'No major red flags identified',
        'Standard due diligence completed',
      ],
      missingInfo: [],
      recommendation: 'Case can proceed to review stage for final approval.',
      processingTime: 1500,
      modelUsed: 'Local Storage Mock Analysis',
    };

    // Save AI summary
    aiSummaryStorage.create(mockSummary);

    // Update case status to ai_ready
    caseStorage.update(id, {
      status: 'ai_ready',
      riskScore: mockSummary.riskScore,
    });

    return {
      message: 'AI analysis triggered successfully',
    };
  },
};

// Document API
export const documentAPI = {
  uploadDocument: async (caseId, file, documentType) => {
    await delay(400);

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Create document record
    const newDocument = documentStorage.create({
      caseId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileData: base64Data, // Store base64 data
    });

    // If it's a screening report, auto-trigger analysis
    if (documentType === 'screening_report') {
      // We could auto-trigger analysis here, but let's leave it manual for MVP
      console.log('Screening report uploaded. Ready for AI analysis.');
    }

    return newDocument;
  },

  getCaseDocuments: async (caseId) => {
    await delay(200);

    const documents = documentStorage.getByCaseId(caseId);
    return documents;
  },

  getDocumentUrl: (documentId) => {
    // Return a data URL that can be used to view the document
    const document = documentStorage.getById(documentId);
    if (document && document.fileData) {
      return document.fileData; // Return base64 data URL
    }
    return null;
  },

  downloadDocument: (documentId) => {
    // For download, we'll return the base64 data URL
    // The frontend will need to handle the actual download
    const document = documentStorage.getById(documentId);
    if (document && document.fileData) {
      return document.fileData;
    }
    return null;
  },

  deleteDocument: async (documentId) => {
    await delay(300);

    documentStorage.delete(documentId);
    return { message: 'Document deleted successfully' };
  },
};

// For backwards compatibility
export default {
  authAPI,
  caseAPI,
  documentAPI,
};
