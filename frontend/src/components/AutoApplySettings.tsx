import React from 'react';

interface AutoApplySettingsProps {
  autoApplyThreshold: number;
  setAutoApplyThreshold: (value: number) => void;
  jobTypes: Record<string, boolean>;
  setJobTypes: (value: Record<string, boolean>) => void;
  minSalary: number;
  setMinSalary: (value: number) => void;
  maxSalary: number;
  setMaxSalary: (value: number) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const AutoApplySettings: React.FC<AutoApplySettingsProps> = ({
  autoApplyThreshold,
  setAutoApplyThreshold,
  jobTypes,
  setJobTypes,
  minSalary,
  setMinSalary,
  maxSalary,
  setMaxSalary,
  onSubmit,
  loading,
}) => (
  <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
      Auto-Apply Settings
    </h2>
    <div className="mb-4">
      <label className="block text-gray-700 text-md font-medium mb-2">
        Auto-Apply Threshold: <span className="font-bold">{autoApplyThreshold}%</span>
      </label>
      <input
        type="range"
        min="0"
        max="100"
        value={autoApplyThreshold}
        onChange={(e) => setAutoApplyThreshold(Number(e.target.value))}
        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer range-slider"
      />
      <p className="text-sm text-gray-500 mt-1">Automatically apply to jobs with simulated skill match above this percentage.</p>
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 text-md font-medium mb-2">
        Job Types:
      </label>
      <div className="flex flex-wrap gap-4">
        {Object.keys(jobTypes).map((type) => (
          <label key={type} className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
              checked={jobTypes[type]}
              onChange={() => setJobTypes({ ...jobTypes, [type]: !jobTypes[type] })}
            />
            <span className="ml-2 text-gray-700">{type}</span>
          </label>
        ))}
      </div>
    </div>
    <div>
      <label className="block text-gray-700 text-md font-medium mb-2">
        Salary Range ($):
      </label>
      <div className="flex gap-4">
        <input
          type="number"
          placeholder="Min ($)"
          value={minSalary}
          onChange={(e) => setMinSalary(Number(e.target.value))}
          className="w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        />
        <input
          type="number"
          placeholder="Max ($)"
          value={maxSalary}
          onChange={(e) => setMaxSalary(Number(e.target.value))}
          className="w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        />
      </div>
    </div>
    <button
      onClick={onSubmit}
      className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"
      disabled={loading}
      type="button"
    >
      {loading ? 'Saving...' : 'Submit'}
    </button>
  </div>
);

export default AutoApplySettings; 