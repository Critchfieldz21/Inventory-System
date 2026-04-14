import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recipesAPI, itemsAPI } from '../../api';
import './recipe.css';

function Recipe() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRecipes, setSelectedRecipes] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ingredients: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, itemsData] = await Promise.all([
        recipesAPI.getAll(),
        itemsAPI.getAll()
      ]);
      // Handle both paginated (object with results) and direct array responses
      const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData.results || []);
      const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.results || []);
      setRecipes(recipesArray);
      setItems(itemsArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipes and items from backend
  useEffect(() => {
    loadData();
  }, []);

  const handleImportXlsx = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await recipesAPI.importXlsx(file);
      await loadData();
      alert(`Import complete. Created: ${result.created || 0}, Updated: ${result.updated || 0}, Skipped: ${result.skipped || 0}`);
    } catch (err) {
      console.error('Error importing recipes xlsx:', err);
      alert('Failed to import recipes xlsx file');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddClick = () => {
    setFormData({ name: '', ingredients: [] });
    setShowAddModal(true);
  };

  const handleRemoveClick = () => {
    if (selectedRecipes.size > 0) {
      setShowRemoveModal(true);
    } else {
      alert('Please select at least one recipe to remove');
    }
  };

  const handleEditClick = () => {
    if (selectedRecipes.size === 0) {
      alert('Please select a recipe to edit');
      return;
    }
    if (selectedRecipes.size > 1) {
      alert('Please select only one recipe to edit');
      return;
    }

    const selectedRecipeId = Array.from(selectedRecipes)[0];
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    
    if (recipe) {
      setEditingRecipeId(recipe.id);
      // Parse ingredients from display string
      const ingredientsList = recipe.ingredients_display
        ? recipe.ingredients_display.split(', ').map(ing => {
            const parts = ing.split(' ');
            const quantity = parseInt(parts[0]) || 1;
            const name = parts.slice(1).join(' ');
            return { name, quantity };
          })
        : [];
      
      setFormData({
        name: recipe.name,
        ingredients: ingredientsList
      });
      setShowEditModal(true);
    }
  };

  const handleConfirmEdit = async () => {
    if (formData.name && formData.ingredients.length > 0) {
      try {
        const ingredientsString = formData.ingredients
          .map(ing => `${ing.quantity} ${ing.name}`)
          .join(', ');
        
        const updatedRecipe = await recipesAPI.update(editingRecipeId, {
          name: formData.name,
          ingredients: ingredientsString
        });
        
        const updatedRecipes = recipes.map(r =>
          r.id === editingRecipeId ? updatedRecipe : r
        );
        
        setRecipes(updatedRecipes);
        setShowEditModal(false);
        setEditingRecipeId(null);
        setFormData({ name: '', ingredients: [] });
        setSelectedRecipes(new Set());
      } catch (err) {
        console.error('Error updating recipe:', err);
        alert('Failed to update recipe');
      }
    } else {
      alert('Please enter a recipe name and add at least one ingredient');
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

  const handleAddIngredient = (itemName) => {
    if (!formData.ingredients.find(ing => ing.name === itemName)) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, { name: itemName, quantity: 1 }]
      });
    }
  };

  const handleRemoveIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const handleUpdateIngredientQuantity = (index, quantity) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index].quantity = parseInt(quantity) || 0;
    setFormData({
      ...formData,
      ingredients: updatedIngredients
    });
  };

  const handleConfirmAdd = async () => {
    if (formData.name && formData.ingredients.length > 0) {
      try {
        // Format ingredients as a string for storage
        const ingredientsString = formData.ingredients
          .map(ing => `${ing.quantity} ${ing.name}`)
          .join(', ');
        
        const newRecipe = await recipesAPI.create({
          name: formData.name,
          ingredients: ingredientsString
        });
        setRecipes([...recipes, newRecipe]);
        setShowAddModal(false);
        setFormData({ name: '', ingredients: [] });
      } catch (err) {
        console.error('Error adding recipe:', err);
        alert('Failed to add recipe');
      }
    } else {
      alert('Please enter a recipe name and add at least one ingredient');
    }
  };

  const handleConfirmRemove = async () => {
    try {
      await Promise.all(Array.from(selectedRecipes).map(id => recipesAPI.delete(id)));
      setRecipes(recipes.filter(r => !selectedRecipes.has(r.id)));
      setShowRemoveModal(false);
      setSelectedRecipes(new Set());
    } catch (err) {
      console.error('Error removing recipes:', err);
      alert('Failed to remove recipes');
    }
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
          {error && <p style={{color: 'red'}}>{error}</p>}
        </header>
        {loading ? (
          <div style={{textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6b7280'}}>
            Loading recipes from database...
          </div>
        ) : (
          <>
        <div className="table-controls">
          <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
          <button className="action-btn edit-btn" onClick={() => importInputRef.current?.click()}>Import XLSX</button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={handleImportXlsx}
          />
          <button className="action-btn edit-btn" onClick={handleEditClick}>Edit</button>
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
              <div>
                <h3>{r.name}</h3>
                <p style={{marginTop: '10px', fontSize: '14px'}}>{r.ingredients_display}</p>
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
                <label>Select Ingredients from Inventory</label>
                <div className="ingredient-selector">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      className="ingredient-btn"
                      onClick={() => handleAddIngredient(item.name)}
                      disabled={formData.ingredients.find(ing => ing.name === item.name)}
                    >
                      + {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Recipe Ingredients</label>
                {formData.ingredients.length > 0 ? (
                  <div className="ingredients-list">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="ingredient-row">
                        <input
                          type="number"
                          min="1"
                          value={ingredient.quantity}
                          onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)}
                          className="ingredient-quantity"
                        />
                        <span className="ingredient-name">{ingredient.name}</span>
                        <button
                          className="btn-remove-ingredient"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#6b7280', fontSize: '14px'}}>No ingredients added yet. Click buttons above to add ingredients.</p>
                )}
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

        {/* Edit Recipe Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Recipe</h2>
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
                <label>Select Ingredients from Inventory</label>
                <div className="ingredient-selector">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      className="ingredient-btn"
                      onClick={() => handleAddIngredient(item.name)}
                      disabled={formData.ingredients.find(ing => ing.name === item.name)}
                    >
                      + {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Recipe Ingredients</label>
                {formData.ingredients.length > 0 ? (
                  <div className="ingredients-list">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="ingredient-row">
                        <input
                          type="number"
                          min="1"
                          value={ingredient.quantity}
                          onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)}
                          className="ingredient-quantity"
                        />
                        <span className="ingredient-name">{ingredient.name}</span>
                        <button
                          className="btn-remove-ingredient"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#6b7280', fontSize: '14px'}}>No ingredients added yet. Click buttons above to add ingredients.</p>
                )}
              </div>

              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmEdit}>Update Recipe</button>
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

export default Recipe;
