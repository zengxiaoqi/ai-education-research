"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type MisconceptionChartDatum = {
  type: string;
  label: string;
  count: number;
  percent: number;
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EF4444", "#14B8A6"];

export function MisconceptionDistributionChart({ data }: { data: MisconceptionChartDatum[] }) {
  return (
    <div className="space-y-4">
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              labelLine={false}
              label={({ percent }) => `${Math.round(percent * 100)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, item) => {
                const payload = item?.payload as MisconceptionChartDatum;
                return [`${value} 次 · ${payload.percent}%`, name];
              }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((item, index) => (
          <div key={item.type} className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden
              />
              <span className="truncate">{item.label}</span>
            </div>
            <span className="font-medium text-gray-700">{item.count} 次 · {item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
