import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recipesAPI, itemsAPI } from '../../api';
import './recipe.css';

function Recipe() {
  const navigate = useNavigate();
  const [data, setData] = useState({ recipes: [], items: [] });
  const [ui, setUi] = useState({
    loading: true, error: null, selectedRecipes: new Set(),
    showAddModal: false, showRemoveModal: false, showEditModal: false, editingRecipeId: null
  });
  const [formData, setFormData] = useState({ name: '', ingredients: [] });

  // Fetch recipes and items from backend
  useEffect(() => {
    (async () => {
      try {
        const [recipesData, itemsData] = await Promise.all([recipesAPI.getAll(), itemsAPI.getAll()]);
        setData({
          recipes: Array.isArray(recipesData) ? recipesData : (recipesData.results || []),
          items: Array.isArray(itemsData) ? itemsData : (itemsData.results || [])
        });
      } catch (err) {
        console.error('Error:', err);
        setUi(prev => ({ ...prev, error: 'Failed to load recipes' }));
      } finally {
        setUi(prev => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  const setUiState = (updates) => setUi(prev => ({ ...prev, ...updates }));

  const handleAddClick = () => {
    setFormData({ name: '', ingredients: [] });
    setUiState({ showAddModal: true });
  };

  const handleRemoveClick = () => {
    if (ui.selectedRecipes.size === 0) return alert('Select at least one recipe');
    setUiState({ showRemoveModal: true });
  };

  const handleEditClick = () => {
    if (ui.selectedRecipes.size === 0) return alert('Select a recipe to edit');
    if (ui.selectedRecipes.size > 1) return alert('Select only one recipe');
    const recipe = data.recipes.find(r => r.id === [...ui.selectedRecipes][0]);
    if (recipe) {
      const ingredientsList = recipe.ingredients_display ? recipe.ingredients_display.split(', ').map(ing => {
        const parts = ing.split(' ');
        return { name: parts.slice(1).join(' '), quantity: parseInt(parts[0]) || 1 };
      }) : [];
      setFormData({ name: recipe.name, ingredients: ingredientsList });
      setUiState({ showEditModal: true, editingRecipeId: recipe.id });
    }
  };

  const handleCheckboxChange = (recipeId) => {
    const newSelected = new Set(ui.selectedRecipes);
    newSelected.has(recipeId) ? newSelected.delete(recipeId) : newSelected.add(recipeId);
    setUiState({ selectedRecipes: newSelected });
  };

  const handleAddIngredient = (itemName) => {
    if (!formData.ingredients.find(ing => ing.name === itemName)) {
      setFormData({ ...formData, ingredients: [...formData.ingredients, { name: itemName, quantity: 1 }] });
    }
  };

  const handleRemoveIngredient = (index) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const handleUpdateIngredientQuantity = (index, quantity) => {
    const updated = [...formData.ingredients];
    updated[index].quantity = parseInt(quantity) || 0;
    setFormData({ ...formData, ingredients: updated });
  };

  const handleConfirmAdd = async () => {
    if (!formData.name || formData.ingredients.length === 0) return alert('Enter recipe name and add ingredients');
    try {
      const ingredientsString = formData.ingredients.map(ing => `${ing.quantity} ${ing.name}`).join(', ');
      const newRecipe = await recipesAPI.create({ name: formData.name, ingredients: ingredientsString });
      setData(prev => ({ ...prev, recipes: [...prev.recipes, newRecipe] }));
      setUiState({ showAddModal: false });
      setFormData({ name: '', ingredients: [] });
    } catch (err) {
      alert('Failed to add recipe');
    }
  };

  const handleConfirmEdit = async () => {
    if (!formData.name || formData.ingredients.length === 0) return alert('Enter recipe name and add ingredients');
    try {
      const ingredientsString = formData.ingredients.map(ing => `${ing.quantity} ${ing.name}`).join(', ');
      const updated = await recipesAPI.update(ui.editingRecipeId, { name: formData.name, ingredients: ingredientsString });
      setData(prev => ({ ...prev, recipes: prev.recipes.map(r => r.id === ui.editingRecipeId ? updated : r) }));
      setUiState({ showEditModal: false, editingRecipeId: null, selectedRecipes: new Set() });
      setFormData({ name: '', ingredients: [] });
    } catch (err) {
      alert('Failed to update recipe');
    }
  };

  const handleConfirmRemove = async () => {
    try {
      await Promise.all(Array.from(ui.selectedRecipes).map(id => recipesAPI.delete(id)));
      setData(prev => ({ ...prev, recipes: prev.recipes.filter(r => !ui.selectedRecipes.has(r.id)) }));
      setUiState({ showRemoveModal: false, selectedRecipes: new Set() });
    } catch (err) {
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
          {ui.error && <p style={{color: 'red'}}>{ui.error}</p>}
        </header>
        {ui.loading ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>Loading recipes...</div>
        ) : (
          <>
            <div className="table-controls">
              <button className="action-btn add-btn" onClick={handleAddClick}>Add</button>
              <button className="action-btn edit-btn" onClick={handleEditClick}>Edit</button>
              <button className="action-btn remove-btn" onClick={handleRemoveClick}>Remove</button>
            </div>
            <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
              {data.recipes.map((r) => (
                <div key={r.id} className={`status-card recipe-card ${ui.selectedRecipes.has(r.id) ? 'selected' : ''}`} style={{marginBottom: '20px', cursor: 'pointer', position: 'relative'}}>
                  <input type="checkbox" checked={ui.selectedRecipes.has(r.id)} onChange={(e) => { e.stopPropagation(); handleCheckboxChange(r.id); }} className="recipe-checkbox" />
                  <div>
                    <h3>{r.name}</h3>
                    <p style={{marginTop: '10px', fontSize: '14px'}}>{r.ingredients_display}</p>
                  </div>
                </div>
              ))}
            </div>

        {/* Add Recipe Modal */}
        {ui.showAddModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showAddModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Recipe</h2>
              <div className="form-group">
                <label>Recipe Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter recipe name" />
              </div>

              <div className="form-group">
                <label>Select Ingredients from Inventory</label>
                <div className="ingredient-selector">
                  {data.items.map((item) => (
                    <button key={item.id} className="ingredient-btn" onClick={() => handleAddIngredient(item.name)} disabled={formData.ingredients.find(ing => ing.name === item.name)}>
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
                        <input type="number" min="1" value={ingredient.quantity} onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)} className="ingredient-quantity" />
                        <span className="ingredient-name">{ingredient.name}</span>
                        <button className="btn-remove-ingredient" onClick={() => handleRemoveIngredient(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#6b7280', fontSize: '14px'}}>No ingredients added yet.</p>
                )}
              </div>

              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmAdd}>Add Recipe</button>
                <button className="btn-cancel" onClick={() => setUiState({ showAddModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Recipe Modal */}
        {ui.showRemoveModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showRemoveModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Removal</h2>
              <p>Remove {ui.selectedRecipes.size} recipe(ies)?</p>
              <div className="items-to-remove">
                {data.recipes.filter(r => ui.selectedRecipes.has(r.id)).map((r) => (
                  <div key={r.id} className="item-to-remove">• {r.name}</div>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="btn-confirm btn-danger" onClick={handleConfirmRemove}>Remove {ui.selectedRecipes.size} Recipe(ies)</button>
                <button className="btn-cancel" onClick={() => setUiState({ showRemoveModal: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Recipe Modal */}
        {ui.showEditModal && (
          <div className="modal-overlay" onClick={() => setUiState({ showEditModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Recipe</h2>
              <div className="form-group">
                <label>Recipe Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Select Ingredients from Inventory</label>
                <div className="ingredient-selector">
                  {data.items.map((item) => (
                    <button key={item.id} className="ingredient-btn" onClick={() => handleAddIngredient(item.name)} disabled={formData.ingredients.find(ing => ing.name === item.name)}>
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
                        <input type="number" min="1" value={ingredient.quantity} onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)} className="ingredient-quantity" />
                        <span className="ingredient-name">{ingredient.name}</span>
                        <button className="btn-remove-ingredient" onClick={() => handleRemoveIngredient(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#6b7280', fontSize: '14px'}}>No ingredients. Click buttons above to add.</p>
                )}
              </div>

              <div className="modal-buttons">
                <button className="btn-confirm" onClick={handleConfirmEdit}>Update Recipe</button>
                <button className="btn-cancel" onClick={() => setUiState({ showEditModal: false })}>Cancel</button>
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
