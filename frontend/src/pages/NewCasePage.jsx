import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseAPI, documentAPI } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import FileUploadField from '../components/shared/FileUploadField';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function NewCasePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clientType: 'individual',
    clientName: '',
    dateOfBirth: '',
    dateOfIncorporation: '',
    country: '',
    nationality: '',
    businessType: '',
    industry: '',
    sourceOfWealth: ''
  });

  const [documents, setDocuments] = useState({
    passport: null,
    brCert: null,
    addressProof: null,
    screeningReport: null,
    others: []
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (field, file) => {
    setDocuments({
      ...documents,
      [field]: file
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create case
      const caseResponse = await caseAPI.createCase(formData);
      const newCaseId = caseResponse.case.id;

      // Upload documents
      const uploadPromises = [];

      if (documents.passport) {
        uploadPromises.push(
          documentAPI.uploadDocument(newCaseId, documents.passport, 'passport')
        );
      }

      if (documents.brCert) {
        uploadPromises.push(
          documentAPI.uploadDocument(newCaseId, documents.brCert, 'br_cert')
        );
      }

      if (documents.addressProof) {
        uploadPromises.push(
          documentAPI.uploadDocument(newCaseId, documents.addressProof, 'address_proof')
        );
      }

      if (documents.screeningReport) {
        uploadPromises.push(
          documentAPI.uploadDocument(newCaseId, documents.screeningReport, 'screening_report')
        );
      }

      if (documents.others?.length > 0) {
        documents.others.forEach((file) => {
          uploadPromises.push(
            documentAPI.uploadDocument(newCaseId, file, 'other')
          );
        });
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Redirect to case detail page
      navigate(`/cases/${newCaseId}`, {
        state: { message: 'Case created successfully. AI analysis will appear once ready.' }
      });
    } catch (err) {
      console.error('Create case error:', err);
      setError(err.response?.data?.error?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New KYC Case</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill in the client information and upload relevant documents
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Client Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="clientType"
                      value="individual"
                      checked={formData.clientType === 'individual'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Individual
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="clientType"
                      value="corporate"
                      checked={formData.clientType === 'corporate'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Corporate
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter client name"
                />
              </div>

              {formData.clientType === 'individual' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Incorporation
                  </label>
                  <input
                    type="date"
                    name="dateOfIncorporation"
                    value={formData.dateOfIncorporation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Hong Kong"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter nationality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <input
                  type="text"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Trading, Manufacturing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Import/Export"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source of Wealth
                </label>
                <textarea
                  name="sourceOfWealth"
                  value={formData.sourceOfWealth}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe the source of wealth..."
                />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Document Upload</h2>

            <div className="space-y-6">
              <FileUploadField
                label="Passport / ID Document"
                onFilesSelected={(file) => handleFileSelect('passport', file)}
                accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
              />

              <FileUploadField
                label="Business Registration / Certificate of Incorporation"
                onFilesSelected={(file) => handleFileSelect('brCert', file)}
                accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
              />

              <FileUploadField
                label="Address Proof"
                onFilesSelected={(file) => handleFileSelect('addressProof', file)}
                accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
              />

              <FileUploadField
                label="Screening Report (Ingenique / Dow Jones / Acuris)"
                onFilesSelected={(file) => handleFileSelect('screeningReport', file)}
                accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
              />

              <FileUploadField
                label="Other Supporting Documents (Optional)"
                onFilesSelected={(files) => handleFileSelect('others', files)}
                accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
                multiple
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating Case...</span>
                </>
              ) : (
                'Create Case & Start Analysis'
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
