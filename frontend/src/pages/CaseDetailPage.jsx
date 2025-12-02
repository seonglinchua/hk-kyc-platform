import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { caseAPI, documentAPI } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { format } from 'date-fns';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [caseData, setCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null });
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      const response = await caseAPI.getCaseById(id);
      setCase(response.case);
    } catch (err) {
      setError('Failed to load case details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await caseAPI.updateCaseStatus(id, newStatus);
      setSuccessMessage(`Case ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchCaseData();
    } catch (err) {
      setError('Failed to update case status');
    }
    setConfirmDialog({ isOpen: false, action: null });
  };

  const handleRefreshAnalysis = async () => {
    try {
      await caseAPI.triggerAnalysis(id);
      setSuccessMessage('AI analysis triggered. Please refresh in a few moments.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to trigger analysis');
    }
  };

  const openConfirmDialog = (action) => {
    setConfirmDialog({ isOpen: true, action });
  };

  const getRiskScoreBadge = (score) => {
    if (!score) return null;

    const config = {
      1: { label: 'Low Risk', className: 'bg-green-100 text-green-800' },
      2: { label: 'Low-Medium Risk', className: 'bg-green-100 text-green-800' },
      3: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Medium-High Risk', className: 'bg-orange-100 text-orange-800' },
      5: { label: 'High Risk', className: 'bg-red-100 text-red-800' }
    };

    const badgeConfig = config[score] || config[3];

    return (
      <span className={`px-4 py-2 rounded-lg text-lg font-semibold ${badgeConfig.className}`}>
        {badgeConfig.label} ({score}/5)
      </span>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="xl" text="Loading case details..." />
        </div>
      </AppLayout>
    );
  }

  if (error || !caseData) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Case not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Cases
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{caseData.clientName}</h1>
                <StatusBadge status={caseData.status} />
              </div>
              <p className="text-sm text-gray-600">Case ID: {caseData.caseNumber}</p>
              <p className="text-sm text-gray-600">
                Created: {format(new Date(caseData.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openConfirmDialog('approve')}
                disabled={caseData.status === 'approved'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve
              </button>
              <button
                onClick={() => openConfirmDialog('reject')}
                disabled={caseData.status === 'rejected'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        {/* Client Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Client Type</p>
              <p className="text-base font-medium text-gray-900 capitalize">{caseData.clientType}</p>
            </div>
            {caseData.dateOfBirth && (
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="text-base font-medium text-gray-900">
                  {format(new Date(caseData.dateOfBirth), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {caseData.dateOfIncorporation && (
              <div>
                <p className="text-sm text-gray-600">Date of Incorporation</p>
                <p className="text-base font-medium text-gray-900">
                  {format(new Date(caseData.dateOfIncorporation), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Country</p>
              <p className="text-base font-medium text-gray-900">{caseData.country}</p>
            </div>
            {caseData.nationality && (
              <div>
                <p className="text-sm text-gray-600">Nationality</p>
                <p className="text-base font-medium text-gray-900">{caseData.nationality}</p>
              </div>
            )}
            {caseData.businessType && (
              <div>
                <p className="text-sm text-gray-600">Business Type</p>
                <p className="text-base font-medium text-gray-900">{caseData.businessType}</p>
              </div>
            )}
            {caseData.industry && (
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="text-base font-medium text-gray-900">{caseData.industry}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Relationship Manager</p>
              <p className="text-base font-medium text-gray-900">{caseData.relationshipManager.name}</p>
            </div>
            {caseData.sourceOfWealth && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Source of Wealth</p>
                <p className="text-base font-medium text-gray-900">{caseData.sourceOfWealth}</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {caseData.aiSummary ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">AI Analysis</h2>
              {getRiskScoreBadge(caseData.aiSummary.riskScore)}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-900">{caseData.aiSummary.summary}</p>
              </div>

              {caseData.aiSummary.redFlags?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Red Flags</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {caseData.aiSummary.redFlags.map((flag, index) => (
                      <li key={index} className="text-red-900">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {caseData.aiSummary.missingInfo?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-yellow-700 mb-2">Missing Information</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {caseData.aiSummary.missingInfo.map((info, index) => (
                      <li key={index} className="text-yellow-900">{info}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendation</h3>
                <p className="text-gray-900 font-medium">{caseData.aiSummary.recommendation}</p>
              </div>

              <div className="text-xs text-gray-600 pt-4 border-t border-gray-300">
                Analyzed on {format(new Date(caseData.aiSummary.processedAt), 'MMM dd, yyyy HH:mm')}
                {caseData.aiSummary.modelUsed && ` using ${caseData.aiSummary.modelUsed}`}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">AI Analysis Pending</h3>
            <p className="mt-1 text-sm text-gray-500">
              The AI is processing this case. Please check back in a few moments.
            </p>
            <button
              onClick={handleRefreshAnalysis}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Trigger Analysis
            </button>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
          {caseData.documents?.length > 0 ? (
            <div className="space-y-3">
              {caseData.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {doc.documentType.replace('_', ' ').toUpperCase()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <a
                    href={documentAPI.getDocumentUrl(doc.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'approve'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={() => handleStatusChange('approved')}
        title="Approve Case"
        message="Are you sure you want to approve this KYC case?"
        confirmText="Approve"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'reject'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={() => handleStatusChange('rejected')}
        title="Reject Case"
        message="Are you sure you want to reject this KYC case?"
        confirmText="Reject"
      />
    </AppLayout>
  );
}
