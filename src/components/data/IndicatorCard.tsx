import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Indicator } from '@/lib/types';

interface IndicatorCardProps {
  indicator: Indicator;
  isSelected: boolean;
  onClick: () => void;
}

export function IndicatorCard({ indicator, isSelected, onClick }: IndicatorCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <Badge variant="secondary" className="mb-2">
            {indicator.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated: {indicator.last_updated}
          </span>
        </div>
        <CardTitle className="text-lg">{indicator.title}</CardTitle>
        <CardDescription className="line-clamp-2">{indicator.description}</CardDescription>
        <div className="mt-2 flex flex-wrap gap-1">
          {indicator.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
}