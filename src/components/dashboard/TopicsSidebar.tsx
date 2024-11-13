import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import type { Topic, Indicator } from './types';

interface DynamicCounts {
  topicCounts: Map<number, number>;
  keywordCounts: Map<string, number>;
}

interface TopicsSidebarProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  setSelectedTopic: (topic: Topic | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  indicators: Indicator[];
  selectedKeywords: string[];
  setSelectedKeywords: (keywords: string[]) => void;
  dynamicCounts?: DynamicCounts;  // Made optional
}

const TopicsSidebar: React.FC<TopicsSidebarProps> = ({
  topics,
  selectedTopic,
  setSelectedTopic,
  searchTerm,
  setSearchTerm,
  indicators,
  selectedKeywords,
  setSelectedKeywords,
  dynamicCounts
}) => {
  // Extract and sort keywords based on dynamic counts
  const sortedKeywords = useMemo(() => {
    const allKeywords = new Set<string>();
    indicators.forEach(indicator => {
      indicator.keywords.forEach(keyword => allKeywords.add(keyword));
    });

    return Array.from(allKeywords).sort((a, b) => {
      const countA = dynamicCounts?.keywordCounts?.get(a) || 0;
      const countB = dynamicCounts?.keywordCounts?.get(b) || 0;
      return countB - countA;
    });
  }, [indicators, dynamicCounts?.keywordCounts]);

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search indicators..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Topics</h2>
        {topics.map((topic) => {
          const topicCount = dynamicCounts?.topicCounts?.get(topic.id) ?? topic.count;
          const isDisabled = topicCount === 0;
          
          return (
            <div key={topic.id} className="mb-2">
              <button
                className={`topic-button ${
                  selectedTopic?.id === topic.id ? 'topic-button-selected' : ''
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isDisabled && setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                disabled={isDisabled}
              >
                <span>{topic.title}</span>
                <span className="topic-count">{topicCount}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {sortedKeywords.map(keyword => {
            const keywordCount = dynamicCounts?.keywordCounts?.get(keyword) ?? 1;
            const isDisabled = keywordCount === 0 && !selectedKeywords.includes(keyword);
            
            return (
              <button
                key={keyword}
                onClick={() => !isDisabled && toggleKeyword(keyword)}
                disabled={isDisabled && !selectedKeywords.includes(keyword)}
                className={`facet-badge ${
                  selectedKeywords.includes(keyword) ? 'facet-badge-selected' : ''
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {keyword} ({keywordCount})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopicsSidebar;
