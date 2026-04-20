/**
 * DashboardChart.js
 * Renders the profit area chart with a Week / Month toggle.
 *
 * Props:
 *   chartView    {'week' | 'month'}         — current toggle state
 *   setChartView (view: string) => void     — toggle setter
 *   weeklyData   Array<{name, profit}>      — 7-day profit data
 *   monthlyData  Array<{name, profit}>      — calendar-day profit data
 */
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './DashboardChart.css';

function DashboardChart({ chartView, setChartView, weeklyData, monthlyData }) {
  return (
    <div className="chart-container">
      {/* Header: title on left, toggle on right */}
      <div className="chart-header">
        <h3 className="card-title">
          {chartView === 'week' ? 'Weekly Profits' : 'Monthly Profits'}
        </h3>
        <div className="chart-toggle">
          <button
            className={`toggle-btn ${chartView === 'week' ? 'active' : ''}`}
            onClick={() => setChartView('week')}
          >
            Week
          </button>
          <button
            className={`toggle-btn ${chartView === 'month' ? 'active' : ''}`}
            onClick={() => setChartView('month')}
          >
            Month
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartView === 'week' ? (
          /* Weekly profit view */
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1ba827" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1ba827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`$${val.toFixed(2)}`, 'Profit']} />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#1ba827"
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        ) : (
          /* Monthly profits view — one point per calendar day */
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorMonthlyProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1ba827" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1ba827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={Math.floor(monthlyData.length / 7)}
              tick={{ fontSize: 11 }}
            />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip formatter={(val) => [`$${val.toFixed(2)}`, 'Profit']} />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#1ba827"
              fillOpacity={1}
              fill="url(#colorMonthlyProfit)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardChart;
