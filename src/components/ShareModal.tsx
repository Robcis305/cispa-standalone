'use client';
import { useState } from 'react';
import { XMarkIcon, ClockIcon, LockClosedIcon, ShareIcon } from '@heroicons/react/24/outline';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateShare: (options: ShareOptions) => void;
  isLoading?: boolean;
}

interface ShareOptions {
  permissions: {
    view: boolean;
    download: boolean;
  };
  expiration_hours?: number;
  email_restrictions?: string[];
}

export default function ShareModal({ isOpen, onClose, onCreateShare, isLoading = false }: ShareModalProps) {
  const [permissions, setPermissions] = useState({
    view: true,
    download: false,
  });
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [emailRestrictions, setEmailRestrictions] = useState<string>('');
  const [useExpiration, setUseExpiration] = useState(true);
  const [useEmailRestrictions, setUseEmailRestrictions] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const options: ShareOptions = {
      permissions,
      expiration_hours: useExpiration ? expirationHours : undefined,
      email_restrictions: useEmailRestrictions && emailRestrictions ? 
        emailRestrictions.split(',').map(email => email.trim()).filter(email => email) : 
        undefined,
    };
    onCreateShare(options);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <ShareIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Share Report</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Access Permissions</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.view}
                  onChange={(e) => setPermissions(prev => ({ ...prev, view: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow viewing online</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={permissions.download}
                  onChange={(e) => setPermissions(prev => ({ ...prev, download: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow PDF download</span>
              </label>
            </div>
          </div>

          {/* Expiration */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Link Expiration</h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useExpiration}
                  onChange={(e) => setUseExpiration(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-600">Enable</span>
              </label>
            </div>
            {useExpiration && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="flex-1 rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                  <option value={720}>30 days</option>
                </select>
              </div>
            )}
          </div>

          {/* Email Restrictions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Email Restrictions</h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useEmailRestrictions}
                  onChange={(e) => setUseEmailRestrictions(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-600">Enable</span>
              </label>
            </div>
            {useEmailRestrictions && (
              <div className="flex items-start space-x-2">
                <LockClosedIcon className="h-4 w-4 text-gray-400 mt-2" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={emailRestrictions}
                    onChange={(e) => setEmailRestrictions(e.target.value)}
                    placeholder="user1@company.com, user2@company.com"
                    className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list of allowed email addresses</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!permissions.view && !permissions.download)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>

          {(!permissions.view && !permissions.download) && (
            <p className="text-xs text-red-600 mt-2">Please select at least one permission</p>
          )}
        </div>
      </div>
    </div>
  );
}