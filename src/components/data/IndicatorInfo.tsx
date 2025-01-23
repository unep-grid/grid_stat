import React from "react";

interface IndicatorInfoProps {
  title?: string;
  unit: string;
  className?: string;
}

export function IndicatorInfo({ title, unit, className = "" }: IndicatorInfoProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {title && <h3 className="text-sm font-medium">{title}</h3>}
      <p className="text-sm">
        Unit: <span className="font-medium">{unit}</span>
      </p>
    </div>
  );
}
