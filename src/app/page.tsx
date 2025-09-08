'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <div className="max-w-3xl">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/cis-partners-logo.png" 
                alt="CIS Partners" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-xl text-gray-600 mb-8">
              CIS Platform Assessment - Streamline your transaction readiness assessment from 40+ hours to under 2 hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/login"
                className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
              <button
                className="bg-white text-gray-900 px-6 py-3 rounded-md text-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={() => alert('Dashboard coming soon!')}
              >
                Learn More
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Assessment</h3>
                <p className="text-gray-600">Complete comprehensive transaction readiness assessments in under 2 hours.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligent Scoring</h3>
                <p className="text-gray-600">AI-powered analysis provides actionable insights and recommendations.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Board-Ready Reports</h3>
                <p className="text-gray-600">Generate professional reports ready for investor presentations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
