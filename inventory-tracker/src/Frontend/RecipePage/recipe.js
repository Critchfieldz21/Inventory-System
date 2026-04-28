import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recipesAPI, itemsAPI } from '../../api';
import AddRecipeModal from './AddRecipeModal';
import EditRecipeModal from './EditRecipeModal';
import RemoveRecipeModal from './RemoveRecipeModal';
import './recipe.css';
import './RecipeCard.css';
import './RecipeModal.css';

function Recipe() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedRecipes, setSelectedRecipes] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
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
    setIngredientSearch('');
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
        setIngredientSearch('');
        setSelectedRecipes(new Set());
      } catch (err) {
        console.error('Error updating recipe:', err);
        alert('Failed to update recipe');
      }
    } else {
      alert('Please enter a recipe name and add at least one ingredient');
    }
  };

  const handleCheckboxChange = useCallback((recipeId) => {
    setSelectedRecipes(prev => {
      const next = new Set(prev);
      next.has(recipeId) ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });
  }, []);

  const handleAddIngredient = useCallback((itemName) => {
    setFormData(prev => {
      if (prev.ingredients.find(ing => ing.name === itemName)) return prev;
      return { ...prev, ingredients: [...prev.ingredients, { name: itemName, quantity: 1 }] };
    });
  }, []);

  const handleRemoveIngredient = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUpdateIngredientQuantity = useCallback((index, quantity) => {
    setFormData(prev => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], quantity: parseInt(quantity) || 0 };
      return { ...prev, ingredients: updated };
    });
  }, []);

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
        setIngredientSearch('');
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
    <div className={`home-layout${sidebarOpen ? ' sidebar-open' : ''}`}>

      {/* ── Hamburger Button ── */}
      <button
        className={`hamburger-btn${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        <span /><span /><span />
      </button>

      {/* ── Overlay ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <h2 className="sidebar-logo">Inventory Tracker</h2>
        <nav className="nav-links">
          <Link to="/home" onClick={() => setSidebarOpen(false)}>Home</Link>
          <Link to="/inventory" onClick={() => setSidebarOpen(false)}>Inventory</Link>
          <Link to="/sales" onClick={() => setSidebarOpen(false)}>Sales</Link>
          <Link to="/recipe" className="active" onClick={() => setSidebarOpen(false)}>Recipes</Link>
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
          <AddRecipeModal
            items={items}
            formData={formData}
            setFormData={setFormData}
            ingredientSearch={ingredientSearch}
            setIngredientSearch={setIngredientSearch}
            handleAddIngredient={handleAddIngredient}
            handleRemoveIngredient={handleRemoveIngredient}
            handleUpdateIngredientQuantity={handleUpdateIngredientQuantity}
            handleConfirmAdd={handleConfirmAdd}
            onClose={() => { setShowAddModal(false); setIngredientSearch(''); }}
          />
        )}

        {/* Remove Recipe Modal */}
        {showRemoveModal && (
          <RemoveRecipeModal
            selectedRecipes={selectedRecipes}
            recipes={recipes}
            handleConfirmRemove={handleConfirmRemove}
            onClose={() => setShowRemoveModal(false)}
          />
        )}

        {/* Edit Recipe Modal */}
        {showEditModal && (
          <EditRecipeModal
            items={items}
            formData={formData}
            setFormData={setFormData}
            ingredientSearch={ingredientSearch}
            setIngredientSearch={setIngredientSearch}
            handleAddIngredient={handleAddIngredient}
            handleRemoveIngredient={handleRemoveIngredient}
            handleUpdateIngredientQuantity={handleUpdateIngredientQuantity}
            handleConfirmEdit={handleConfirmEdit}
            onClose={() => { setShowEditModal(false); setIngredientSearch(''); }}
          />
        )}
          </>
        )}
      </main>
    </div>
  );
}

export default Recipe;
