import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import type { PollutionHistoryPointDto } from "../hooks/types";

interface PollutionLineChartProps {
  data: PollutionHistoryPointDto[];
  height?: number;
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export const PollutionLineChart: React.FC<PollutionLineChartProps> = ({
  data,
  height = 220,
  color = "#60a5fa",
  showLegend = false,
  showGrid = true,
}) => {
  const normalized = useMemo(() => {
    const arr = [...(data ?? [])].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return arr.map((p) => ({
      time: formatTime(p.timestamp),
      aqi: p.aqi,
      pm25: p.pollutants.pm25,
      pm10: p.pollutants.pm10,
    }));
  }, [data]);

  return (
    <div style={{ width: "100%", height: height, backgroundColor: "#0b1220", borderRadius: 12, border: "1px solid #1f2937", overflow: "hidden" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={normalized}
          margin={{ top: 10, right: 16, bottom: 0, left: -10 }}
        >
          {showGrid && <CartesianGrid stroke="#374151" strokeDasharray="3 3" />}
          <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" width={40} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#e5e7eb" }}
            itemStyle={{ color: "#e5e7eb" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ color: "#e5e7eb" }}
              iconType="circle"
              iconSize={8}
              verticalAlign="top"
              height={24}
            />
          )}
          <Line
            type="monotone"
            dataKey="aqi"
            name="AQI"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="pm25"
            name="PM2.5"
            stroke="#34d399"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="pm10"
            name="PM10"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};