import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FilterState } from "../../lib/types";
import type { Language } from "@/lib/utils/translations";
import { t } from "@/lib/utils/translations";

interface FilterPanelProps {
  language: Language;
  topics: string[];
  sources: string[];
  keywords: string[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  topicCount: Record<string, number>;
  sourceCount: Record<string, number>;
  keywordCount: Record<string, number>;
}

export function FilterPanel({
  language,
  topics,
  sources,
  keywords,
  filters,
  onFilterChange,
  topicCount,
  sourceCount,
  keywordCount,
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFilterChange({ ...filters, search: value });
  };

  const toggleTopic = (topic: string) => {
    const newTopics = filters.topics.includes(topic)
      ? filters.topics.filter((t) => t !== topic)
      : [...filters.topics, topic];
    onFilterChange({ ...filters, topics: newTopics });
  };

  const toggleSource = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFilterChange({ ...filters, sources: newSources });
  };

  const toggleKeyword = (keyword: string) => {
    const newKeywords = filters.keywords.includes(keyword)
      ? filters.keywords.filter((k) => k !== keyword)
      : [...filters.keywords, keyword];
    onFilterChange({ ...filters, keywords: newKeywords });
  };

  const resetFilters = () => {
    setSearchInput("");
    onFilterChange({
      search: "",
      topics: [],
      sources: [],
      keywords: [],
    });
  };

  const hasActiveFilters =
    filters.search || 
    filters.topics.length > 0 || 
    filters.sources.length > 0 || 
    filters.keywords.length > 0;

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("dv.search_indicators", language)}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              className="shrink-0"
              title={t("dv.reset_filters", language)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">
              {t("dv.metadata_topics", language)}
            </h3>
            <div className="space-y-2">
              {topics.map((topic) => {
                const count = topicCount[topic] || 0;
                const isDisabled =
                  count === 0 && !filters.topics.includes(topic);
                return (
                  <Card
                    key={topic}
                    className={`cursor-pointer p-2 transition-colors ${
                      filters.topics.includes(topic)
                        ? "bg-primary text-primary-foreground"
                        : isDisabled
                        ? "opacity-50 hover:bg-muted/50"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => !isDisabled && toggleTopic(topic)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{topic}</p>
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium">
              {t("dv.metadata_sources", language)}
            </h3>
            <div className="space-y-2">
              {sources.map((source) => {
                const count = sourceCount[source] || 0;
                const isDisabled =
                  count === 0 && !filters.sources.includes(source);
                return (
                  <Card
                    key={source}
                    className={`cursor-pointer p-2 transition-colors ${
                      filters.sources.includes(source)
                        ? "bg-primary text-primary-foreground"
                        : isDisabled
                        ? "opacity-50 hover:bg-muted/50"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => !isDisabled && toggleSource(source)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{source}</p>
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium">
              {t("dv.keywords", language)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => {
                const count = keywordCount[keyword] || 0;
                const isDisabled =
                  count === 0 && !filters.keywords.includes(keyword);
                return (
                  <Button
                    key={keyword}
                    variant={filters.keywords.includes(keyword) ? "default" : "outline"}
                    className={`h-7 rounded-full text-xs ${
                      isDisabled ? "opacity-50 cursor-default" : ""
                    }`}
                    onClick={() => !isDisabled && toggleKeyword(keyword)}
                  >
                    {keyword}
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 rounded-full px-1 text-[10px]"
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
