'use client';
import { useState, useEffect } from 'react';
import { CompanyProfile } from '@/types/database.types';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CompanyProfileEditorProps {
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => Promise<void>;
  className?: string;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Goods',
  'Manufacturing',
  'Real Estate',
  'Energy',
  'Retail',
  'Media & Entertainment',
  'Transportation',
  'Education',
  'Professional Services',
  'Other'
];

const COMPANY_STAGES = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'growth', label: 'Growth' },
  { value: 'late_stage', label: 'Late Stage' }
];

const BUSINESS_MODELS = [
  { value: 'b2b_saas', label: 'B2B SaaS' },
  { value: 'b2c', label: 'B2C' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'biotech', label: 'Biotech' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'other', label: 'Other' }
];

const INVESTMENT_TYPES = [
  { value: 'control', label: 'Control' },
  { value: 'minority', label: 'Minority' },
  { value: 'either', label: 'Either' }
];

export default function CompanyProfileEditor({ profile, onSave, className = '' }: CompanyProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<CompanyProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | null) => {
    if (!value) return 'Not specified';
    return `${value}%`;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Edit Company Profile</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSaving}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={editedProfile.company_name}
              onChange={(e) => setEditedProfile({ ...editedProfile, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={editedProfile.industry || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, industry: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Revenue ($)
            </label>
            <input
              type="number"
              value={editedProfile.annual_revenue || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, annual_revenue: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 5000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funding Amount Sought ($)
            </label>
            <input
              type="number"
              value={editedProfile.funding_amount_sought || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, funding_amount_sought: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Stage
            </label>
            <select
              value={editedProfile.company_stage || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, company_stage: e.target.value as any || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Stage</option>
              {COMPANY_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Model
            </label>
            <select
              value={editedProfile.business_model || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, business_model: e.target.value as any || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Business Model</option>
              {BUSINESS_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Type
            </label>
            <select
              value={editedProfile.investment_type || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, investment_type: e.target.value as any || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Investment Type</option>
              {INVESTMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geographic Location
            </label>
            <input
              type="text"
              value={editedProfile.geographic_location || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, geographic_location: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. New York, NY"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Growth Rate (%)
            </label>
            <input
              type="number"
              value={editedProfile.growth_rate || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, growth_rate: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 25"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Company Profile</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <dt className="text-sm font-medium text-gray-500">Company Name</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.company_name || 'Not specified'}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Industry</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.industry || 'Not specified'}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Annual Revenue</dt>
          <dd className="mt-1 text-sm text-gray-900">{formatCurrency(profile.annual_revenue)}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Funding Amount Sought</dt>
          <dd className="mt-1 text-sm text-gray-900">{formatCurrency(profile.funding_amount_sought)}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Company Stage</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {profile.company_stage 
              ? COMPANY_STAGES.find(s => s.value === profile.company_stage)?.label || profile.company_stage
              : 'Not specified'
            }
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Business Model</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {profile.business_model 
              ? BUSINESS_MODELS.find(m => m.value === profile.business_model)?.label || profile.business_model
              : 'Not specified'
            }
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Investment Type</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {profile.investment_type 
              ? INVESTMENT_TYPES.find(t => t.value === profile.investment_type)?.label || profile.investment_type
              : 'Not specified'
            }
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Geographic Location</dt>
          <dd className="mt-1 text-sm text-gray-900">{profile.geographic_location || 'Not specified'}</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Growth Rate</dt>
          <dd className="mt-1 text-sm text-gray-900">{formatPercentage(profile.growth_rate)}</dd>
        </div>
      </div>
    </div>
  );
}