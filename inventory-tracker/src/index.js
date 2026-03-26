import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './Frontend/loginPage/loginPage';
import HomePage from './Frontend/HomePage/home';
import Inventory from './Frontend/InventoryPage/items';
import Recipe from './Frontend/RecipePage/recipe'
import Sales from './Frontend/SalesPage/sales'


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
