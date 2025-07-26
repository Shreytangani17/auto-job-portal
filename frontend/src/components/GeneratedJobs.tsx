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
  link?: string; // Added for job link
  source?: string; // Added for job source
}

interface GeneratedJobsProps {
  jobs: Job[];
  isLoading: boolean;
  isAutoApplied: boolean;
  onAutoApply: () => void;
  savedJobs?: Job[];
  setSavedJobs?: (jobs: Job[]) => void;
  JobSkeleton?: () => JSX.Element;
}

function calculateResumeScore(job: Job, skills: string[]) {
  if (!job || !skills || skills.length === 0) return 0;
  const text = (job.title + ' ' + (job.description || '')).toLowerCase();
  const matched = skills.filter(skill => text.includes(skill.toLowerCase()));
  return Math.round((matched.length / skills.length) * 100);
}

const GeneratedJobs: React.FC<GeneratedJobsProps> = ({ jobs, isLoading, isAutoApplied, onAutoApply, savedJobs = [], setSavedJobs, JobSkeleton }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-8">
        {JobSkeleton ? Array.from({ length: 3 }).map((_, i) => <JobSkeleton key={i} />) : <div>Loading...</div>}
      </div>
    );
  }
  if (!jobs.length) return null;
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Simulated Job/Internship Suggestions:
      </h2>
      <div className="space-y-6 mb-6">
        {jobs.map((job) => {
          const isSaved = savedJobs.some(j => j.id === job.id);
          return (
            <div key={job.id} className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                <button
                  className={`ml-2 text-xl ${isSaved ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500`}
                  title={isSaved ? 'Remove from Saved' : 'Save Job'}
                  onClick={() => {
                    if (!setSavedJobs) return;
                    if (isSaved) {
                      setSavedJobs(savedJobs.filter(j => j.id !== job.id));
                    } else {
                      setSavedJobs([...savedJobs, job]);
                    }
                  }}
                >
                  {isSaved ? '★' : '☆'}
                </button>
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
              <p className="text-purple-700 text-sm mb-2 font-semibold">Resume Score: {calculateResumeScore(job, window.extractedSkills || [])}%</p>
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
              {/* Auto Apply Section */}
              <div className="mt-4 flex flex-col gap-2">
                {job.link && (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 text-center"
                  >
                    Apply on {job.source || 'Job Board'}
                  </a>
                )}
                <span className="text-xs text-gray-500">This will open the real job application page. Automated application is subject to site policies and may not be possible for all jobs.</span>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onAutoApply}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
        disabled={isAutoApplied || isLoading}
      >
        {isAutoApplied ? 'Auto-Applied!' : 'Simulate Auto-Apply to All Jobs'}
      </button>
      {isAutoApplied && (
        <p className="mt-4 text-sm text-gray-600 text-center">
          Reminder: This is a simulation and does not interact with real job boards.
        </p>
      )}
    </div>
  );
};

export default GeneratedJobs; 