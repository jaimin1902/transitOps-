"use client";

import React from "react";

interface ChartItem {
  label: string;
  revenue: number;
  cost: number;
}

interface CustomSVGChartProps {
  data: ChartItem[];
}

export function CustomSVGChart({ data }: CustomSVGChartProps) {
  // Padding & Dimensions
  const paddingX = 60;
  const paddingY = 40;
  const width = 600;
  const height = 300;

  // Find max value to scale chart height
  const maxVal = React.useMemo(() => {
    if (data.length === 0) return 1000;
    const values = data.flatMap((d) => [d.revenue, d.cost]);
    return Math.max(...values, 500) * 1.15; // 15% top margin padding
  }, [data]);

  // Calculations
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Grid ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-card p-5 shadow-small">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Trip logistics analysis</h3>
          <p className="text-xs text-gray-500 mt-0.5">Revenue vs operating costs for the latest dispatches</p>
        </div>
        {/* Legends */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-primary-500 rounded-sm"></span>
            <span className="text-gray-600">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-400 rounded-sm"></span>
            <span className="text-gray-600">Cost</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-60 flex items-center justify-center text-gray-400 text-sm font-medium">
          No dispatch details registered to plot analytics.
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto">
            {/* Gridlines & Y Ticks */}
            {ticks.map((t, idx) => {
              const yVal = height - paddingY - t * chartHeight;
              const labelVal = Math.round(t * maxVal);
              return (
                <g key={idx} className="opacity-70">
                  <line
                    x1={paddingX}
                    y1={yVal}
                    x2={width - paddingX}
                    y2={yVal}
                    stroke="#E2E8F0"
                    strokeWidth={1}
                    strokeDasharray={idx === 0 ? "0" : "4 4"}
                  />
                  <text
                    x={paddingX - 10}
                    y={yVal + 4}
                    textAnchor="end"
                    className="text-[10px] fill-gray-500 font-bold font-mono"
                  >
                    ${labelVal.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Bars drawing */}
            {data.map((d, idx) => {
              const groupWidth = chartWidth / data.length;
              const groupX = paddingX + idx * groupWidth;
              const barWidth = (groupWidth * 0.6) / 2; // two bars: revenue & cost
              const spacing = groupWidth * 0.1;

              // Scale heights
              const revHeight = (d.revenue / maxVal) * chartHeight;
              const costHeight = (d.cost / maxVal) * chartHeight;

              const revX = groupX + spacing;
              const revY = height - paddingY - revHeight;

              const costX = revX + barWidth + 2;
              const costY = height - paddingY - costHeight;

              const labelX = groupX + groupWidth / 2;

              return (
                <g key={idx} className="group cursor-pointer">
                  {/* Revenue Bar */}
                  <rect
                    x={revX}
                    y={revY}
                    width={barWidth}
                    height={Math.max(revHeight, 2)}
                    rx={2}
                    className="fill-primary-500 hover:fill-primary-600 transition-colors duration-150"
                  />
                  {/* Cost Bar */}
                  <rect
                    x={costX}
                    y={costY}
                    width={barWidth}
                    height={Math.max(costHeight, 2)}
                    rx={2}
                    className="fill-rose-400 hover:fill-rose-500 transition-colors duration-150"
                  />

                  {/* X axis labels */}
                  <text
                    x={labelX}
                    y={height - paddingY + 16}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-600 font-semibold font-mono"
                  >
                    {d.label}
                  </text>

                  {/* Tooltips */}
                  <title>
                    {`${d.label}\nRevenue: $${d.revenue.toLocaleString()}\nCost: $${d.cost.toLocaleString()}`}
                  </title>
                </g>
              );
            })}

            {/* Base line */}
            <line
              x1={paddingX}
              y1={height - paddingY}
              x2={width - paddingX}
              y2={height - paddingY}
              stroke="#CBD5E1"
              strokeWidth={1.5}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
