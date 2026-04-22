/**
 * DashboardLists.js
 * Renders the two bottom dashboard cards:
 *   - Top 3 Items Sold
 *   - Low Stock Alerts
 *
 * Props:
 *   topItems      Array<{itemName, quantity}>
 *   lowStockItems Array<{id, name, stock}>
 */
import React, { memo } from 'react';
import './DashboardLists.css';

const PERIOD_LABEL = { week: 'This Week', month: 'This Month', quarter: 'This Quarter' };

const DashboardLists = memo(function DashboardLists({ topItems, lowStockItems, chartView = 'week' }) {
  const periodLabel = PERIOD_LABEL[chartView] || 'This Week';
  return (
    <div className="bottom-lists-row">

      {/* Top 3 Items Sold */}
      <div className="status-card">
        <div className="card-header">
          <h3>Top 3 Items Sold — {periodLabel}</h3>
        </div>
        <ul className="status-list">
          {topItems.length > 0 ? (
            topItems.map((item, index) => (
              <li key={index} className="list-item">
                <span>{index + 1}. {item.itemName}</span>
                <strong>{item.quantity} sold</strong>
              </li>
            ))
          ) : (
            <li className="list-item">
              <span>No sales data available</span>
            </li>
          )}
        </ul>
      </div>

      {/* Low Stock Alerts */}
      <div className="status-card">
        <div className="card-header">
          <h3>Low Stock Alerts</h3>
        </div>
        <ul className="status-list">
          {lowStockItems.length > 0 ? (
            lowStockItems.map((item) => (
              <li key={item.id} className="list-item">
                <span>{item.name}</span>
                <span className={`stock-tag ${item.stock < 10 ? 'critical' : 'warning'}`}>
                  {item.stock} left
                </span>
              </li>
            ))
          ) : (
            <li className="list-item">
              <span>No low stock items</span>
            </li>
          )}
        </ul>
      </div>

    </div>
  );
});

export default DashboardLists;
