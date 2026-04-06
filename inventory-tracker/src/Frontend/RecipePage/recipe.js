import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './recipe.css';

function Recipe() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([
    {
      id: 1,
      name: 'Classic Burger',
      ingredients: '1 Burger Bun, 1 Beef Patty, 1 Cheddar Cheese, Lettuce, Tomato, Ketchup'
    },
    {
      id: 2,
      name: 'Bacon Cheeseburger',
      ingredients: '1 Burger Bun, 1 Beef Patty, 1 Bacon Strips, 1 Cheddar Cheese, Lettuce, Mayonnaise'
    },
    {
      id: 3,
      name: 'Chicken Burger',
      ingredients: '1 Burger Bun, 1 Chicken Breast, 1 Cheddar Cheese, Lettuce, Tomato'
    },
  ]);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ingredients: ''
  });

  const handleAddClick = () => {
    setFormData({ name: '', ingredients: '' });
    setShowAddModal(true);
  };

  const handleRemoveClick = () => {
    if (selectedRecipes.size > 0) {
      setShowRemoveModal(true);
    } else {
      alert('Please select at least one recipe to remove');
    }
  };

  const handleCheckboxChange = (recipeId) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
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
    setRecipes(recipes.filter(r => !selectedRecipes.has(r.id)));
    setShowRemoveModal(false);
    setSelectedRecipes(new Set());
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
              className={`status-card recipe-card ${selectedRecipes.has(r.id) ? 'selected' : ''}`}
              style={{marginBottom: '20px', cursor: 'pointer', position: 'relative'}}
            >
              <input 
                type="checkbox" 
                checked={selectedRecipes.has(r.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange(r.id);
                }}
                className="recipe-checkbox"
              />
              <div onClick={() => setSelectedRecipe(r)}>
                <h3>{r.name}</h3>
                <p style={{marginTop: '10px', fontSize: '14px'}}>{r.ingredients}</p>
              </div>
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
              <p>Are you sure you want to remove {selectedRecipes.size} recipe(ies)?</p>
              <div className="items-to-remove">
                {recipes.filter(r => selectedRecipes.has(r.id)).map((r) => (
                  <div key={r.id} className="item-to-remove">
                    • {r.name}
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove {selectedRecipes.size} Recipe(ies)</button>
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
