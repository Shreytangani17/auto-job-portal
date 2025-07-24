import React from 'react';

interface ExtractedSkillsProps {
  skills: string[];
}

const ExtractedSkills: React.FC<ExtractedSkillsProps> = ({ skills }) => (
  <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
      Extracted Skills:
    </h2>
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span
          key={index}
          className="bg-blue-200 text-blue-800 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
        >
          {skill}
        </span>
      ))}
    </div>
  </div>
);

export default ExtractedSkills; 