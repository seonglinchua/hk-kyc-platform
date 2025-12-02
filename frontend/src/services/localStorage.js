// Local Storage Service
// Manages all data persistence using browser localStorage

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  USERS: 'kyc_users',
  CASES: 'kyc_cases',
  DOCUMENTS: 'kyc_documents',
  AI_SUMMARIES: 'kyc_ai_summaries',
};

// Helper function to get data from localStorage
const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

// Helper function to save data to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Initialize storage with default data if empty
export const initializeStorage = () => {
  // Initialize users if not exists
  if (!getFromStorage(STORAGE_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        username: 'admin',
        password: 'password123', // Plain text for MVP
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user-2',
        email: 'rm@example.com',
        username: 'rm',
        password: 'password123', // Plain text for MVP
        name: 'Relationship Manager',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    saveToStorage(STORAGE_KEYS.USERS, defaultUsers);
  }

  // Initialize cases if not exists
  if (!getFromStorage(STORAGE_KEYS.CASES)) {
    const defaultCases = [
      {
        id: 'case-demo-1',
        caseNumber: 'KYC-2025-00001',
        clientType: 'individual',
        clientName: 'John Doe',
        dateOfBirth: '1985-06-15',
        country: 'Hong Kong',
        nationality: 'Hong Kong',
        sourceOfWealth: 'Salary from employment in financial services',
        status: 'pending',
        riskScore: null,
        rmId: 'user-1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'case-demo-2',
        caseNumber: 'KYC-2025-00002',
        clientType: 'corporate',
        clientName: 'ABC Trading Limited',
        dateOfIncorporation: '2020-03-20',
        country: 'Hong Kong',
        businessType: 'Trading',
        industry: 'Import/Export',
        sourceOfWealth: 'Trading profits from international commerce',
        status: 'in_review',
        riskScore: 3,
        rmId: 'user-2',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    saveToStorage(STORAGE_KEYS.CASES, defaultCases);
  }

  // Initialize documents if not exists
  if (!getFromStorage(STORAGE_KEYS.DOCUMENTS)) {
    saveToStorage(STORAGE_KEYS.DOCUMENTS, []);
  }

  // Initialize AI summaries if not exists
  if (!getFromStorage(STORAGE_KEYS.AI_SUMMARIES)) {
    saveToStorage(STORAGE_KEYS.AI_SUMMARIES, []);
  }
};

// Generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate case number
const generateCaseNumber = () => {
  const cases = getFromStorage(STORAGE_KEYS.CASES) || [];
  const caseCount = cases.length + 1;
  const year = new Date().getFullYear();
  return `KYC-${year}-${String(caseCount).padStart(5, '0')}`;
};

// User operations
export const userStorage = {
  getAll: () => getFromStorage(STORAGE_KEYS.USERS) || [],

  getById: (id) => {
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    return users.find((user) => user.id === id);
  },

  getByEmail: (email) => {
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    return users.find((user) => user.email === email);
  },

  create: (userData) => {
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    const newUser = {
      id: generateId(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  update: (id, userData) => {
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...userData,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    return null;
  },
};

// Case operations
export const caseStorage = {
  getAll: (filters = {}) => {
    let cases = getFromStorage(STORAGE_KEYS.CASES) || [];

    // Apply filters
    if (filters.status) {
      cases = cases.filter((c) => c.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      cases = cases.filter(
        (c) =>
          c.caseNumber?.toLowerCase().includes(searchLower) ||
          c.clientName?.toLowerCase().includes(searchLower) ||
          c.country?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    cases.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return cases;
  },

  getById: (id) => {
    const cases = getFromStorage(STORAGE_KEYS.CASES) || [];
    return cases.find((c) => c.id === id);
  },

  create: (caseData) => {
    const cases = getFromStorage(STORAGE_KEYS.CASES) || [];
    const newCase = {
      id: generateId(),
      caseNumber: generateCaseNumber(),
      status: 'pending',
      riskScore: null,
      ...caseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cases.push(newCase);
    saveToStorage(STORAGE_KEYS.CASES, cases);
    return newCase;
  },

  update: (id, caseData) => {
    const cases = getFromStorage(STORAGE_KEYS.CASES) || [];
    const index = cases.findIndex((c) => c.id === id);
    if (index !== -1) {
      cases[index] = {
        ...cases[index],
        ...caseData,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.CASES, cases);
      return cases[index];
    }
    return null;
  },

  delete: (id) => {
    const cases = getFromStorage(STORAGE_KEYS.CASES) || [];
    const filtered = cases.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.CASES, filtered);

    // Also delete related documents
    const documents = getFromStorage(STORAGE_KEYS.DOCUMENTS) || [];
    const filteredDocs = documents.filter((doc) => doc.caseId !== id);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, filteredDocs);

    // Delete related AI summary
    const summaries = getFromStorage(STORAGE_KEYS.AI_SUMMARIES) || [];
    const filteredSummaries = summaries.filter((s) => s.caseId !== id);
    saveToStorage(STORAGE_KEYS.AI_SUMMARIES, filteredSummaries);

    return true;
  },

  updateStatus: (id, status, userId) => {
    const cases = getFromStorage(STORAGE_KEYS.CASES) || [];
    const index = cases.findIndex((c) => c.id === id);
    if (index !== -1) {
      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.approvedAt = new Date().toISOString();
        updateData.approvedBy = userId;
      } else if (status === 'rejected') {
        updateData.rejectedAt = new Date().toISOString();
        updateData.rejectedBy = userId;
      }

      cases[index] = { ...cases[index], ...updateData };
      saveToStorage(STORAGE_KEYS.CASES, cases);
      return cases[index];
    }
    return null;
  },
};

// Document operations
export const documentStorage = {
  getAll: () => getFromStorage(STORAGE_KEYS.DOCUMENTS) || [],

  getByCaseId: (caseId) => {
    const documents = getFromStorage(STORAGE_KEYS.DOCUMENTS) || [];
    return documents.filter((doc) => doc.caseId === caseId);
  },

  getById: (id) => {
    const documents = getFromStorage(STORAGE_KEYS.DOCUMENTS) || [];
    return documents.find((doc) => doc.id === id);
  },

  create: (documentData) => {
    const documents = getFromStorage(STORAGE_KEYS.DOCUMENTS) || [];
    const newDocument = {
      id: generateId(),
      ...documentData,
      uploadedAt: new Date().toISOString(),
    };
    documents.push(newDocument);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, documents);
    return newDocument;
  },

  delete: (id) => {
    const documents = getFromStorage(STORAGE_KEYS.DOCUMENTS) || [];
    const filtered = documents.filter((doc) => doc.id !== id);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, filtered);
    return true;
  },
};

// AI Summary operations
export const aiSummaryStorage = {
  getByCaseId: (caseId) => {
    const summaries = getFromStorage(STORAGE_KEYS.AI_SUMMARIES) || [];
    return summaries.find((s) => s.caseId === caseId);
  },

  create: (summaryData) => {
    const summaries = getFromStorage(STORAGE_KEYS.AI_SUMMARIES) || [];

    // Remove existing summary for this case if any
    const filtered = summaries.filter((s) => s.caseId !== summaryData.caseId);

    const newSummary = {
      id: generateId(),
      ...summaryData,
      processedAt: new Date().toISOString(),
    };

    filtered.push(newSummary);
    saveToStorage(STORAGE_KEYS.AI_SUMMARIES, filtered);
    return newSummary;
  },

  update: (caseId, summaryData) => {
    const summaries = getFromStorage(STORAGE_KEYS.AI_SUMMARIES) || [];
    const index = summaries.findIndex((s) => s.caseId === caseId);

    if (index !== -1) {
      summaries[index] = {
        ...summaries[index],
        ...summaryData,
        processedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.AI_SUMMARIES, summaries);
      return summaries[index];
    } else {
      // Create new if doesn't exist
      return aiSummaryStorage.create({ caseId, ...summaryData });
    }
  },
};

// Token and session management
// Renamed from 'sessionStorage' to avoid collision with browser's sessionStorage API
export const authSession = {
  setToken: (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  removeToken: () => localStorage.removeItem(STORAGE_KEYS.TOKEN),

  setUser: (user) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem(STORAGE_KEYS.USER),

  clearSession: () => {
    authSession.removeToken();
    authSession.removeUser();
  },
};

export default {
  initializeStorage,
  userStorage,
  caseStorage,
  documentStorage,
  aiSummaryStorage,
  authSession,
};
