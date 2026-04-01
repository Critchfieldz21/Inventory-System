import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './recipe.css';

const RECIPE_STORAGE_KEY = 'inventory_recipes';
/* Recipes are saved in the localStorage under this key so when you navigate between pages, the data persists */
function Recipe() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(() => {
    const savedRecipes = localStorage.getItem(RECIPE_STORAGE_KEY);

    if (!savedRecipes) {
      return [];
    }

    try {
      return JSON.parse(savedRecipes);
    } catch (error) {
      return [];
    }
  });

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ingredients: ''
  });

  useEffect(() => {
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
  }, [recipes]);

  const handleAddClick = () => {
    setFormData({ name: '', ingredients: '' });
    setShowAddModal(true);
  };

  const handleRemoveClick = () => {
    if (selectedRecipe !== null) {
      setShowRemoveModal(true);
    } else {
      alert('Please select a recipe to remove');
    }
  };

  const handleConfirmAdd = () => {
    if (formData.name && formData.ingredients) {
      const newRecipe = {
        id: Math.max(...recipes.map(r => r.id), 0) + 1,
        name: formData.name,
        ingredients: formData.ingredients
      };
      setRecipes([...recipes, newRecipe]);
      setShowAddModal(false);
    }
  };

  const handleConfirmRemove = () => {
    setRecipes(recipes.filter(r => r.id !== selectedRecipe.id));
    setShowRemoveModal(false);
    setSelectedRecipe(null);
  };

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
        </header>
        <div className="table-controls">
          <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
          <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
        </div>
        <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
          {recipes.map((r) => (
            <div 
              key={r.id} 
              className={`status-card recipe-card ${selectedRecipe?.id === r.id ? 'selected' : ''}`}
              onClick={() => setSelectedRecipe(r)}
              style={{marginBottom: '20px', cursor: 'pointer'}}
            >
              <h3>{r.name}</h3>
              <p style={{marginTop: '10px', fontSize: '14px'}}>{r.ingredients}</p>
            </div>
          ))}
        </div>

        {/* Add Recipe Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Recipe</h2>
              <div className="form-group">
                <label>Recipe Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter recipe name"
                />
              </div>
              <div className="form-group">
                <label>Ingredients</label>
                <textarea 
                  value={formData.ingredients}
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  placeholder="Enter ingredients (e.g., 1 Bun, 1 Patty, 1 Cheese Slice)"
                  rows="4"
                />
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmAdd}>Add Recipe</button>
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Recipe Modal */}
        {showRemoveModal && (
          <div className="modal-overlay" onClick={() => setShowRemoveModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Removal</h2>
              <p>Are you sure you want to remove this recipe?</p>
              <p className="sale-info">Recipe: {selectedRecipe?.name}</p>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove</button>
                <button className="btn-cancel" onClick={() => setShowRemoveModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Recipe;
