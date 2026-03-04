import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Recipe() {
  const navigate = useNavigate();
  const recipes = [
    { name: 'Classic Burger', ingredients: '1 Bun, 1 Patty, 1 Cheese Slice' },
    { name: 'Garden Salad', ingredients: '2 Lettuce, 1 Tomato, 0.5 Onion' },
  ];

  return (
    <div className="home-layout">
      <aside className="sidebar">
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home">Home</Link>
          <Link to="/inventory">Items</Link>
          <Link to="/sales">Sales</Link>
          <Link to="/recipe" className="active">Recipes</Link>
        </nav>
        <button onClick={() => navigate('/')} className="logout-btn">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>Recipe Management</h1>
          <p>Define ingredient usage for your menu items.</p>
        </header>
        <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
          {recipes.map((r, i) => (
            <div key={i} className="status-card" style={{marginBottom: '20px'}}>
              <h3>{r.name}</h3>
              <p style={{marginTop: '10px', fontSize: '14px'}}>{r.ingredients}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Recipe;
