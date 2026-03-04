import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './loginPage/loginPage';
import HomePage from './HomePage/home';
import Inventory from './InventoryPage/items';
import Recipe from './RecipePage/recipe'
import Sales from './SalesPage/sales'


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/recipe" element={<Recipe />} />
      <Route path="/sales" element={<Sales />} />
    </Routes>
  </BrowserRouter>
);
