import React from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  jobType: string;
  isRemote: boolean;
  salary: number;
  status: string;
  matchScore: number;
  appliedDaysAgo: number;
  interviewScheduled: boolean;
  interviewTime?: string | null;
}

interface AppliedJobsListProps {
  jobs: Job[];
}

const AppliedJobsList: React.FC<AppliedJobsListProps> = ({ jobs }) => {
  if (!jobs.length) return null;
  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Your Applied Jobs/Internships
      </h2>
      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
              {job.status === 'Interview Scheduled' && (
                <span className="bg-green-200 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  Interview Scheduled
                </span>
              )}
              {job.status === 'Under Review' && (
                <span className="bg-yellow-200 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                  Under Review
                </span>
              )}
              {job.status === 'Applied' && (
                <span className="bg-blue-200 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Applied
                </span>
              )}
            </div>
            <p className="text-blue-600 font-medium mb-3">{job.company}</p>
            <p className="text-gray-700 text-base leading-relaxed mb-2">{job.description}</p>
            <p className="text-gray-600 text-sm mb-1">
              <span className="font-semibold">Type:</span> {job.jobType} {job.isRemote ? '(Remote)' : ''}
            </p>
            <p className="text-gray-600 text-sm mb-3">
              <span className="font-semibold">Salary:</span> ${job.salary.toLocaleString()}
            </p>
            <p className="text-gray-600 text-sm mb-2">
              Applied {job.appliedDaysAgo} days ago
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${job.matchScore}%` }}></div>
            </div>
            <p className="text-gray-600 text-sm mb-2">Skill Match: {job.matchScore}%</p>
            {job.interviewScheduled && job.interviewTime && (
              <p className="text-green-700 text-sm font-semibold flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
                Interview: {job.interviewTime}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppliedJobsList; 