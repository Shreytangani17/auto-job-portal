import React from 'react';

interface ApplicationStatusDashboardProps {
  appliedJobsCount: number;
  inReviewJobsCount: number;
  interviewScheduledCount: number;
  responseRate: number;
}

const ApplicationStatusDashboard: React.FC<ApplicationStatusDashboardProps> = ({
  appliedJobsCount,
  inReviewJobsCount,
  interviewScheduledCount,
  responseRate,
}) => (
  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
      Application Status
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-100 p-4 rounded-lg text-center">
        <p className="text-4xl font-bold text-blue-700">{appliedJobsCount}</p>
        <p className="text-lg text-blue-600">Applied</p>
      </div>
      <div className="bg-yellow-100 p-4 rounded-lg text-center">
        <p className="text-4xl font-bold text-yellow-700">{inReviewJobsCount}</p>
        <p className="text-lg text-yellow-600">In Review</p>
      </div>
      <div className="bg-green-100 p-4 rounded-lg text-center">
        <p className="text-4xl font-bold text-green-700">{interviewScheduledCount}</p>
        <p className="text-lg text-green-600">Interview</p>
      </div>
      <div className="bg-purple-100 p-4 rounded-lg text-center">
        <p className="text-4xl font-bold text-purple-700">{responseRate}%</p>
        <p className="text-lg text-purple-600">Response Rate</p>
      </div>
    </div>
  </div>
);

export default ApplicationStatusDashboard; 