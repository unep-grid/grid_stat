import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import type { Indicator } from "@/lib/types";
import type { Language } from "@/lib/utils/translations";
import { t } from "@/lib/utils/translations";

interface IndicatorCardProps {
  indicator: Indicator;
  isSelected: boolean;
  onClick: () => void;
  language: Language;
}

export function IndicatorCard({
  indicator,
  isSelected,
  onClick,
  language,
}: IndicatorCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start gap-2">
          {indicator.type === "statistical" && (
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          )}
          {indicator.topics.map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{indicator.name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">
          {indicator.description}
        </CardDescription>
        <div className="mt-2 flex flex-wrap gap-1">
          {indicator.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {indicator.sources.map((source) => (
            <div key={source.name_short} className="mt-1">
              {source.name}
            </div>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
}
