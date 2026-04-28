/**
 * FinancialSummary.js
 * Renders the three financial summary cards at the top of the
 * dashboard: Total Revenue, Total Expenses, and Total Profit.
 *
 * Props:
 *   financialData  {{ revenue: number, expenses: number, profit: number }}
 */
import React, { memo } from 'react';
import './FinancialSummary.css';

const FinancialSummary = memo(function FinancialSummary({ financialData }) {
  return (
    <div className="financial-summary">
      <div className="financial-card revenue">
        <h4 className="financial-label">Total Revenue</h4>
        <p className="financial-amount">${parseFloat(financialData.revenue).toFixed(2)}</p>
      </div>
      <div className="financial-card expenses">
        <h4 className="financial-label">Total Expenses</h4>
        <p className="financial-amount">${parseFloat(financialData.expenses).toFixed(2)}</p>
      </div>
      <div className="financial-card profit">
        <h4 className="financial-label">Total Profit</h4>
        <p className="financial-amount">${parseFloat(financialData.profit).toFixed(2)}</p>
      </div>
    </div>
  );
});

export default FinancialSummary;
