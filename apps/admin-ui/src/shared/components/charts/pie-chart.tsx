"use client";
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PieChartComponentProps {
  data: { name: string; value: number }[];
  colors: string[];
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  colors,
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <defs>
          <filter
            id="shadow"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="4"
              floodColor="#000"
              floodOpacity="0.2"
            />
          </filter>
        </defs>

        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          stroke="#0f172a"
          strokeWidth={2}
          isAnimationActive
          filter="url(#shadow)"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#fff" }}
        />

        {/* External Legend */}
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          formatter={(value) => (
            <span className="text-white text-sm ml-1">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};