import React from 'react';

interface AppPerformance {
  responseRate: number;
  interviewRate: number;
  profileViews: number;
}

interface InsightsImprovementsProps {
  successScore: number;
  appPerformance: AppPerformance;
  improvementSuggestions: string[];
}

const InsightsImprovements: React.FC<InsightsImprovementsProps> = ({
  successScore,
  appPerformance,
  improvementSuggestions,
}) => (
  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
      Insights & Improvements
    </h2>
    <div className="mb-4">
      <p className="text-gray-700 text-lg font-medium mb-2">Your Success Score:</p>
      <div className="flex items-baseline mb-4">
        <p className="text-5xl font-bold text-green-600 mr-2">{successScore}/10</p>
        <p className="text-lg text-gray-600">Great job! You're performing above average</p>
      </div>
    </div>
    <div className="mb-4">
      <p className="text-gray-700 text-lg font-medium mb-2">Application Performance:</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Response Rate</span>
          <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${appPerformance.responseRate}%` }}></div>
          </div>
          <span className="text-gray-800 font-semibold">{appPerformance.responseRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Interview Rate</span>
          <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
            <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${appPerformance.interviewRate}%` }}></div>
          </div>
          <span className="text-gray-800 font-semibold">{appPerformance.interviewRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Profile Views</span>
          <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${appPerformance.profileViews}%` }}></div>
          </div>
          <span className="text-gray-800 font-semibold">{appPerformance.profileViews}%</span>
        </div>
      </div>
    </div>
    <div>
      <p className="text-gray-700 text-lg font-medium mb-2">Improvement Suggestions:</p>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        {improvementSuggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
    </div>
  </div>
);

export default InsightsImprovements; 