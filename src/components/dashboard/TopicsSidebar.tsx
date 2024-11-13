// src/components/dashboard/TopicsSidebar.tsx
import React from 'react';
import { Search } from 'lucide-react';
import type { Topic } from './types';

interface TopicsSidebarProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  setSelectedTopic: (topic: Topic | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const TopicsSidebar: React.FC<TopicsSidebarProps> = ({
  topics,
  selectedTopic,
  setSelectedTopic,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="p-6">
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="GHG"
          className="w-full pl-8 pr-4 py-2 bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Topics</h2>
        {topics.map((topic, index) => (
          <div key={index} className="mb-2">
            <button
              className="flex items-center justify-between w-full py-2 text-left group"
              onClick={() => setSelectedTopic(topic)}
            >
              <span className="text-gray-900 group-hover:text-blue-600">{topic.title}</span>
              <span className="text-gray-500 text-sm">{topic.count}</span>
            </button>
            {topic.subtopics.length > 0 && selectedTopic?.title === topic.title && (
              <div className="ml-4 mt-1">
                {topic.subtopics.map((subtopic, idx) => (
                  <div key={idx} className="py-1 px-2 text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                    {subtopic}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicsSidebar;
