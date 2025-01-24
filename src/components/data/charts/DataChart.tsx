import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import type { Indicator, IndicatorData } from "@/lib/types";
import type { Language } from "@/lib/utils/translations";
import { t } from "@/lib/utils/translations";
import { getTopRegions } from "@/lib/utils/region_scoring";
import { IndicatorInfo } from "../IndicatorInfo";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  Search,
  X,
  CheckSquare,
  Square,
  Filter,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const colorPalette = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  country: string;
  value: number;
  year: string;
  color: string;
}

const DOT_SIZE = 4;

interface DotProps {
  cx: number;
  cy: number;
  payload: {
    year: number;
    [key: string]: number;
  };
  dataKey: string;
  stroke: string;
  value: number;
  onHover: (state: TooltipState) => void;
  onLeave: () => void;
}

const CustomDot = ({
  cx,
  cy,
  payload,
  dataKey,
  stroke,
  value,
  onHover,
  onLeave,
}: DotProps) => {
  if (!cx || !cy) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={DOT_SIZE}
      fill="white"
      stroke={stroke}
      strokeWidth={2}
      onMouseEnter={() =>
        onHover({
          visible: true,
          x: cx,
          y: cy,
          country: dataKey,
          value: value,
          year: payload.year.toString(),
          color: stroke,
        })
      }
      onMouseLeave={onLeave}
    />
  );
};

interface DataChartProps {
  data: IndicatorData[];
  language: Language;
  indicator?: Indicator;
}

interface RegionPanelProps {
  allRegions: number[];
  selectedRegions: number[];
  onRegionToggle: (regionId: number) => void;
  onSelectAll: () => void;
  onSelectDefault: () => void;
  data: IndicatorData[];
  colorPalette: string[];
  language: Language;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSelected: boolean;
  onShowSelectedChange: (value: boolean) => void;
}

function RegionPanel({
  allRegions,
  selectedRegions,
  onRegionToggle,
  onSelectAll,
  onSelectDefault,
  data,
  colorPalette,
  language,
  searchQuery,
  onSearchChange,
  showSelected,
  onShowSelectedChange,
}: RegionPanelProps) {
  const filteredRegions = useMemo(() => {
    return allRegions.filter((regionId) => {
      const regionName =
        data.find((d) => d.geo_entity_id === regionId)?.geo_entity || "";
      const matchesSearch = regionName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return showSelected
        ? matchesSearch && selectedRegions.includes(regionId)
        : matchesSearch;
    });
  }, [allRegions, data, searchQuery, showSelected, selectedRegions]);

  return (
    <div className="bg-background h-full w-[320px] flex flex-col">
      <div className="h-full p-4 flex flex-col">
        <div className="space-y-4 flex-none">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("dv.search_regions", language)}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSearchChange("")}
                title={t("dv.clear_search", language)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onSelectAll}
              title={t("dv.select_all_regions", language)}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onSelectDefault}
              title={t("dv.select_default", language)}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={showSelected ? "default" : "outline"}
              size="icon"
              onClick={() => onShowSelectedChange(!showSelected)}
              title={t("dv.show_selected", language)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 -mx-1 px-1 mt-4">
          <ScrollArea className="h-full mt-4">
            <div className="space-y-1">
              {filteredRegions.map((regionId, index) => {
                const regionName = data.find(
                  (d) => d.geo_entity_id === regionId
                )?.geo_entity;
                if (!regionName) return null;
                return (
                  <div key={regionId} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={selectedRegions.includes(regionId)}
                      onCheckedChange={() => onRegionToggle(regionId)}
                      id={`region-${regionId}`}
                    />
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: selectedRegions.includes(regionId)
                          ? colorPalette[
                              selectedRegions.indexOf(regionId) %
                                colorPalette.length
                            ]
                          : "transparent",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <label
                      htmlFor={`region-${regionId}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {regionName}
                    </label>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export function DataChart({ data, language, indicator }: DataChartProps) {
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [showSelected, setShowSelected] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    country: "",
    value: 0,
    year: "",
    color: "",
  });

  // Get unique regions and sort them by name
  const allRegions = useMemo(() => {
    const uniqueRegions = [...new Set(data.map((item) => item.geo_entity_id))];
    return uniqueRegions.sort((a, b) => {
      const nameA = data.find((d) => d.geo_entity_id === a)?.geo_entity || "";
      const nameB = data.find((d) => d.geo_entity_id === b)?.geo_entity || "";
      return nameA.localeCompare(nameB);
    });
  }, [data]);

  // Select initial regions
  useEffect(() => {
    if (allRegions.length > 0 && selectedRegions.length === 0) {
      selectDefault();
    }
  }, [allRegions, selectedRegions.length]);

  // Get unit from data
  const unit = data[0]?.unit || "";
  const title = indicator?.name;

  // Transform data for the chart
  const chartData = useMemo(() => {
    const yearMap = new Map();

    data.forEach((item) => {
      if (!selectedRegions.includes(item.geo_entity_id)) {
        return;
      }

      if (!yearMap.has(item.date_start)) {
        yearMap.set(item.date_start, { year: item.date_start });
      }

      const yearData = yearMap.get(item.date_start);
      yearData[item.geo_entity] = item.value;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [data, selectedRegions]);

  const selectAll = () => {
    setSelectedRegions([...allRegions]);
  };

  const selectDefault = useCallback(() => {
    try {
      const topRegions = getTopRegions(data, 10);
      setSelectedRegions(topRegions.map((r) => r.geoEntityId));
    } catch (error) {
      console.error("Error selecting default regions:", error);
      // Fallback to first region if there's an error
      if (allRegions.length > 0) {
        setSelectedRegions([allRegions[0]]);
      }
    }
  }, [data, allRegions]);

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("dv.no_data", language)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <IndicatorInfo title={title} unit={unit} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              title={t("dv.download", language)}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("dv.download", language)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPanelVisible(!isPanelVisible)}
              title={t("dv.toggle_panel", language)}
            >
              {isPanelVisible ? (
                <BarChart2 className="h-4 w-4 mr-2" />
              ) : (
                <BarChart2 className="h-4 w-4 mr-2 rotate-180" />
              )}
              {t("dv.regions", language)} ({selectedRegions.length}/
              {allRegions.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Chart area */}
        <div className="flex-1 min-h-0 relative px-4">
          {tooltip.visible && (
            <div
              className="absolute bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 py-2 rounded-lg border shadow-sm pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y - DOT_SIZE - 10,
                transform: "translate(-50%, -100%)",
                zIndex: 50,
              }}
            >
              <div className="font-medium" style={{ color: tooltip.color }}>
                {tooltip.country}
              </div>
              <div className="text-sm text-muted-foreground">
                {tooltip.year}
              </div>
              <div className="text-sm">
                {tooltip.value.toLocaleString()}
                {unit ? ` ${unit}` : ""}
              </div>
            </div>
          )}
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <YAxis
                  width={60}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`
                  }
                />
                {selectedRegions.map((regionId, index) => {
                  const regionName = data.find(
                    (d) => d.geo_entity_id === regionId
                  )?.geo_entity;
                  if (!regionName) return null;
                  return (
                    <Line
                      key={regionId}
                      type="monotone"
                      name={regionName}
                      dataKey={regionName}
                      stroke={colorPalette[index % colorPalette.length]}
                      dot={(dotProps) => {
                        const { key, payload, ...restProps } = dotProps;
                        return (
                          <CustomDot
                            key={`dot-${regionName}-${payload.year}`}
                            payload={payload}
                            {...restProps}
                            onHover={setTooltip}
                            onLeave={() =>
                              setTooltip((prev) => ({ ...prev, visible: false }))
                            }
                          />
                        );
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right panel */}
        <div
          className={`h-full transition-all duration-300 ease-in-out border-l bg-muted/10 ${
            isPanelVisible
              ? "w-[320px] opacity-100"
              : "w-0 opacity-0 overflow-hidden"
          }`}
        >
          <RegionPanel
            allRegions={allRegions}
            selectedRegions={selectedRegions}
            onRegionToggle={(regionId) => {
              setSelectedRegions((prev) =>
                prev.includes(regionId)
                  ? prev.filter((id) => id !== regionId)
                  : [...prev, regionId]
              );
            }}
            onSelectAll={selectAll}
            onSelectDefault={selectDefault}
            data={data}
            colorPalette={colorPalette}
            language={language}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSelected={showSelected}
            onShowSelectedChange={setShowSelected}
          />
        </div>
      </div>
    </div>
  );
}
