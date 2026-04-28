/**
 * DashboardChart.js
 * Renders the profit/expense/revenue area chart with:
 *   - Week / Month / Quarter time-range toggle (pill buttons)
 *   - Profit / Expenses / Revenue metric dropdown (arrow box)
 */
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './DashboardChart.css';

const METRIC_CONFIG = {
  profit:  { color: '#1ba827', gradId: 'gradProfit',  dataKey: 'profit',   label: 'Profit'   },
  expense: { color: '#ef4444', gradId: 'gradExpense', dataKey: 'expenses', label: 'Expenses' },
  revenue: { color: '#4f46e5', gradId: 'gradRevenue', dataKey: 'revenue',  label: 'Revenue'  },
};

function DashboardChart({  chartView, setChartView,
  chartMetric, setChartMetric,
  weeklyData, weeklyExpenseData, weeklyRevenueData,
  monthlyData, monthlyExpenseData, monthlyRevenueData,
  quarterlyData,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { color, gradId, dataKey, label } = METRIC_CONFIG[chartMetric] || METRIC_CONFIG.profit;

  // Memoize chart data — only recompute when the view, metric, or underlying series changes
  const chartData = useMemo(() => {
    const sourceMap = {
      week:    { profit: weeklyData,  expense: weeklyExpenseData,  revenue: weeklyRevenueData  },
      month:   { profit: monthlyData, expense: monthlyExpenseData, revenue: monthlyRevenueData },
      quarter: {
        profit:  (quarterlyData?.profit   || []),
        expense: (quarterlyData?.expenses || []),
        revenue: (quarterlyData?.revenue  || []),
      },
    };
    return (sourceMap[chartView] || sourceMap.week)[chartMetric] || [];
  }, [chartView, chartMetric, weeklyData, weeklyExpenseData, weeklyRevenueData,
      monthlyData, monthlyExpenseData, monthlyRevenueData, quarterlyData]);

  const metricOptions = [
    { value: 'profit',  label: 'Profit'   },
    { value: 'expense', label: 'Expenses' },
    { value: 'revenue', label: 'Revenue'  },
  ];

  const viewLabel = { week: 'Weekly', month: 'Monthly', quarter: 'Quarterly' };

  const xAxisInterval =
    chartView === 'month'   ? Math.floor((chartData?.length || 1) / 7) :
    chartView === 'quarter' ? 1 : 0;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-group">
          <h3 className="card-title">{viewLabel[chartView] || 'Weekly'}</h3>

          <div className="metric-dropdown" ref={dropdownRef}>
            <button
              className="metric-dropdown-btn"
              onClick={() => setDropdownOpen(o => !o)}
              title="Switch metric"
            >
              {label}
              <span className="metric-dropdown-arrow">▾</span>
            </button>
            {dropdownOpen && (
              <ul className="metric-dropdown-list">
                {metricOptions.map(opt => (
                  <li
                    key={opt.value}
                    className={`metric-dropdown-option ${chartMetric === opt.value ? 'active' : ''}`}
                    onMouseDown={() => {
                      setChartMetric(opt.value);
                      setDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="chart-controls">
          <div className="chart-toggle">
            {['week', 'month', 'quarter'].map(view => (
              <button
                key={view}
                className={`toggle-btn ${chartView === view ? 'active' : ''}`}
                onClick={() => setChartView(view)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={xAxisInterval}
            tick={{ fontSize: chartView === 'week' ? 12 : 11 }}
          />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip formatter={(val) => [`$${Number(val).toFixed(2)}`, label]} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fillOpacity={1}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(DashboardChart);
