import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './Frontend/loginPage/loginPage';
import HomePage from './Frontend/HomePage/home';
import Inventory from './Frontend/InventoryPage/items';
import Recipe from './Frontend/RecipePage/recipe';
import Sales from './Frontend/SalesPage/sales';
import RequireAuth from './Frontend/RequireAuth';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/inventory"
        element={
          <RequireAuth>
            <Inventory />
          </RequireAuth>
        }
      />
      <Route
        path="/recipe"
        element={
          <RequireAuth>
            <Recipe />
          </RequireAuth>
        }
      />
      <Route
        path="/sales"
        element={
          <RequireAuth>
            <Sales />
          </RequireAuth>
        }
      />
    </Routes>
  </BrowserRouter>
);
