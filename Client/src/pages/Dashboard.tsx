import { useState, useEffect, useCallback } from 'react';
import backgroundImageFile from '../assets/Salt Ramsay.png';

type UnitType = 'GRAM' | 'KILOGRAM' | 'MILLILITRE' | 'LITRE' | 'PIECE' | 'SLICE' | 'CLOVE' | 'TEASPOON' | 'TABLESPOON' | 'CUP';

interface Ingredient {
    id: number;
    name: string;
    quantity: number;
    unit: UnitType;
    expiryDate: string;
}

interface Recipe {
    id: number;
    title: string;
    instructions: string;
    prepTimeMinutes?: number;
    nutritionInfo?: string;
}

interface UserPreferences {
    allergies: string[];
    dietFocus: string;
}

interface Favourite {
    id: number;
    userEmail: string;
    recipe: Recipe;
}

function Dashboard() {
    const jwtToken = localStorage.getItem('fridgeai_token');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const authHeaders = useCallback((): HeadersInit => ({
        'Content-Type': 'application/json',
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
    }), [jwtToken]);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newName, setNewName] = useState('');
    const [newQuantity, setNewQuantity] = useState<number>(1);
    const [newUnit, setNewUnit] = useState<UnitType>('PIECE');
    const [newExpiry, setNewExpiry] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [preferences, setPreferences] = useState<UserPreferences>({ allergies: [], dietFocus: '' });
    const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);
    const [isGeneratingRecipes, setIsGeneratingRecipes] = useState<boolean>(false);
    const [aiRecipes, setAiRecipes] = useState<Recipe | null>(null);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'GENERATED' | 'FAVORITES'>('GENERATED');
    const [favorites, setFavorites] = useState<Favourite[]>([]);

    useEffect(() => {
        const fetchUserInventory = async () => {
            try {
                const response = await fetch('/api/inventory', { headers: authHeaders() });
                if (!response.ok) {
                    throw new Error(`Inventory Service responded ${response.status}`);
                }
                const data: Ingredient[] = await response.json();
                setIngredients(data);
                setLoadError(null);
            } catch (error) {
                console.error('Failed fetching database inventory:', error);
                setLoadError('Could not load your inventory. Is the Inventory Service running?');
            }
        };
        fetchUserInventory();
    }, [authHeaders]);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await fetch('/api/preferences/me', { headers: authHeaders() });
                if (response.ok) {
                    const data: UserPreferences = await response.json();
                    setPreferences({
                        allergies: Array.isArray(data.allergies) ? data.allergies : [],
                        dietFocus: data.dietFocus || ''
                    });
                }
            } catch (error) {
                console.error('Failed loading user profile configurations:', error);
            }
        };
        fetchPreferences();
    }, [authHeaders]);

    useEffect(() => {
        const fetchUserFavorites = async () => {
            try {
                const response = await fetch('/api/recipes/favourites', { headers: authHeaders() });
                if (response.ok) {
                    const data: Favourite[] = await response.json();
                    setFavorites(data);
                }
            } catch (error) {
                console.error('Failed fetching saved favorites list:', error);
            }
        };
        fetchUserFavorites();
    }, [authHeaders]);

    const calculateDaysLeft = (expiryDateStr: string): number => {
        const expiryTarget = new Date(expiryDateStr).getTime();
        const todayMidnight = new Date().setHours(0, 0, 0, 0);

        const difference = expiryTarget - todayMidnight;
        return Math.floor(difference / (1000 * 60 * 60 * 24));
    };

    const handleSignOut = () => {
        console.log("Clearing active session token context:", jwtToken);
        localStorage.removeItem('fridgeai_token');
        window.location.reload();
    };

    const handleAddNewItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newExpiry || newQuantity <= 0) return alert('Please enter valid structural details!');

        const ingredientPayload = {
            name: newName,
            quantity: newQuantity,
            unit: newUnit,
            expiryDate: newExpiry,
        };

        try {
            const response = await fetch('/api/inventory/items', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(ingredientPayload),
            });

            if (!response.ok) {
                throw new Error(`Inventory Service responded ${response.status}`);
            }

            const savedItem: Ingredient = await response.json();
            setIngredients(prev => [...prev, savedItem]);

            setNewName('');
            setNewQuantity(1);
            setNewUnit('PIECE');
            setNewExpiry('');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed syncing with Inventory Service:', error);
            alert('Could not add item — Inventory Service unreachable. Please try again.');
        }
    };

    const handleDeleteItem = async (id: number) => {
        try {
            const response = await fetch(`/api/inventory/items/${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Inventory Service responded ${response.status}`);
            }

            setIngredients(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed deleting ingredient:', error);
            alert('Could not remove item — Inventory Service unreachable. Please try again.');
        }
    };

    const handleGenerateRecipes = async () => {
        setIsGeneratingRecipes(true);
        try {
            const response = await fetch('/api/recipes/generate', {
                method: 'POST',
                headers: authHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Recipe Service responded with status ${response.status}`);
            }

            const data: Recipe = await response.json();
            setAiRecipes(data);
        }
        catch (error) {
            console.error('Failed generating AI recipes:', error);
            alert('Could not generate meals. Check the recipe-service terminal logs.');
        }
        finally {
            setIsGeneratingRecipes(false);
        }
    };

    const isRecipeFavourited = (recipeId: number | undefined): boolean => {
        if (!recipeId) return false;
        return favorites.some(fav => fav.recipe.id === recipeId);
    };

    const handleToggleFavourite = async (e: React.MouseEvent, recipe: Recipe) => {
        e.stopPropagation();

        const recipeId = recipe.id;
        const currentlyFavourited = isRecipeFavourited(recipeId);

        try {
            if (currentlyFavourited) {
                const response = await fetch(`/api/recipes/${recipeId}/favourite`, {
                    method: 'DELETE',
                    headers: authHeaders(),
                });
                if (!response.ok) throw new Error();
                setFavorites(prev => prev.filter(fav => fav.recipe.id !== recipeId));
            } else {
                const response = await fetch(`/api/recipes/${recipeId}/favourite`, {
                    method: 'POST',
                    headers: authHeaders(),
                });
                if (!response.ok) throw new Error();
                const newFav: Favourite = await response.json();
                setFavorites(prev => [...prev, newFav]);
            }
        } catch (error) {
            console.error('Failed toggling favorited state with recipe service:', error);
            alert('Could not update your favorites list. Try again!');
        }
    };

    const handleSavePreferences = async () => {
        setIsSavingPrefs(true);

        const payload = {
            dietFocus: preferences.dietFocus,
            allergies: preferences.allergies
                .map(s => s.trim())
                .filter(Boolean) // Cleans out accidental empty slots from trailing commas
        };

        try {
            const response = await fetch('/api/preferences/me', {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to update preferences backend configurations');
            }
        } catch (error) {
            console.error('Error syncing preference profile data:', error);
            alert('Could not save your dietary profile. Please try again.');
        } finally {
            setIsSavingPrefs(false);
        }
    };

    // --- STYLING PATTERNS ---
    const layoutContainer: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',

        backgroundImage: `url(${backgroundImageFile})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',

        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        backgroundColor: '#0c0c0e',
    };

    const navBar: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        backgroundColor: '#111625',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        width: '100%',
        boxSizing: 'border-box'
    };

    const mainContent: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '2.5fr 1fr',
        gap: '25px',
        padding: '30px',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        flexGrow: 1
    };

    const panelCard: React.CSSProperties = {
        backgroundColor: 'rgba(25, 25, 30, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        boxSizing: 'border-box',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff'
    };

    const itemGrid: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        marginTop: '20px'
    };

    const modalOverlay: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px',
        marginTop: '5px',
        marginBottom: '15px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        boxSizing: 'border-box'
    };

    return (
        <div style={layoutContainer}>

            {/* Top Header Layer */}
            <nav style={navBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        title="Open Diet Profiles"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '0px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#9b59b6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
                    >
                        ☰
                    </button>
                    <h2 style={{ margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>FridgeAI Control Panel</h2>
                </div>
                <button onClick={handleSignOut} style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                    Sign Out
                </button>
            </nav>

            {/* Main UI Layout Area */}
            <main style={mainContent}>

                {/* Left Grid: Active Ingredient Management */}
                <section style={panelCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f4f6f8', paddingBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '20px' }}>My Virtual Fridge Inventory</h3>
                        <button onClick={() => setIsModalOpen(true)} style={{ padding: '10px 18px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 5px rgba(46,204,113,0.3)' }}>
                            + Add Item
                        </button>
                    </div>

                    {loadError && (
                        <p style={{ marginTop: '15px', color: '#e74c3c', fontSize: '14px' }}>{loadError}</p>
                    )}

                    {!loadError && ingredients.length === 0 && (
                        <p style={{ marginTop: '15px', color: '#b3b3b3', fontSize: '14px' }}>
                            Your fridge is empty. Click <strong>+ Add Item</strong> to start tracking ingredients.
                        </p>
                    )}

                    <div style={itemGrid}>
                        {ingredients.map(item => {
                            const daysLeft = calculateDaysLeft(item.expiryDate);
                            const isUrgent = daysLeft <= 2;

                            return (
                                <div key={item.id} style={{ position: 'relative', padding: '18px', borderRadius: '8px', border: `1px solid ${isUrgent ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`, backgroundColor: isUrgent ? 'rgba(231, 76, 60, 0.15)' : 'rgba(255,255,255,0.03)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                    <button onClick={() => handleDeleteItem(item.id)} title="Remove item" style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', lineHeight: '1', padding: 0, backgroundColor: 'transparent', color: '#95a5a6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
                                        ×
                                    </button>
                                    <h4 style={{ margin: '0 0 10px 0', paddingRight: '20px', color: '#ffffff', fontSize: '16px' }}>{item.name}</h4>
                                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#7f8c8d' }}>
                                        Amount: <strong>{item.quantity}</strong> <span style={{ fontSize: '12px', color: '#95a5a6' }}>{item.unit}</span>
                                    </p>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: isUrgent ? '#e74c3c' : '#27ae60' }}>
                    {daysLeft <= 0 ? '⚠️ Expired!' : daysLeft === 1 ? '⏰ Expires tomorrow!' : `Expires in ${daysLeft} days`}
                  </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Right Tab: AI Output Tracking Panel */}
                <aside style={panelCard}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#ffffff', fontSize: '20px' }}>AI Recipe Genius</h3>

                    <button
                        onClick={handleGenerateRecipes}
                        disabled={isGeneratingRecipes}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#9b59b6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginBottom: '15px',
                            boxShadow: '0 2px 5px rgba(155,89,182,0.3)',
                            opacity: isGeneratingRecipes ? 0.7 : 1
                        }}
                    >
                        {isGeneratingRecipes ? '🔄 Syncing AI Menu...' : '✨ Auto-Generate Meals'}
                    </button>

                    {/* Sub-Navigation Tab Bar */}
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '15px', gap: '10px' }}>
                        <button
                            onClick={() => setActiveTab('GENERATED')}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                backgroundColor: 'transparent',
                                color: activeTab === 'GENERATED' ? '#9b59b6' : '#b3b3b3',
                                border: 'none',
                                borderBottom: activeTab === 'GENERATED' ? '2px solid #9b59b6' : '2px solid transparent',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🤖 AI Menu
                        </button>
                        <button
                            onClick={() => setActiveTab('FAVORITES')}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                backgroundColor: 'transparent',
                                color: activeTab === 'FAVORITES' ? '#e74c3c' : '#b3b3b3',
                                border: 'none',
                                borderBottom: activeTab === 'FAVORITES' ? '2px solid #e74c3c' : '2px solid transparent',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ⭐ Favorites ({favorites.length})
                        </button>
                    </div>

                    {/* Dynamic Tab Panel Views */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '4px' }}>

                        {/* TAB 1: AI GENERATED MENU */}
                        {activeTab === 'GENERATED' && (
                            <>
                                {!aiRecipes && !isGeneratingRecipes && (
                                    <p style={{ fontSize: '14px', color: '#b3b3b3', textAlign: 'center', marginTop: '10px' }}>No meals generated yet.</p>
                                )}

                                {aiRecipes && (
                                    <div
                                        key={aiRecipes.id}
                                        onClick={() => setIsRecipeModalOpen(true)}
                                        style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', maxHeight: '180px', overflow: 'hidden', position: 'relative' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {/* Dynamic Floating Action Star */}
                                        <button
                                            onClick={(e) => handleToggleFavourite(e, aiRecipes)}
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', outline: 'none', transition: 'transform 0.1s ease', zIndex: 10 }}
                                            title={isRecipeFavourited(aiRecipes.id) ? "Remove from Favorites" : "Add to Favorites"}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                                        >
                                            {isRecipeFavourited(aiRecipes.id) ? '⭐' : '☆'}
                                        </button>

                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#ffffff', fontWeight: 'bold', paddingRight: '25px' }}>{aiRecipes.title}</h4>
                                        {aiRecipes.prepTimeMinutes && <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '8px' }}>⏱️ Prep Time: <strong>{aiRecipes.prepTimeMinutes} mins</strong></div>}
                                        <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{aiRecipes.instructions}</div>
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, rgba(25, 25, 30, 0.95))', pointerEvents: 'none' }} />
                                    </div>
                                )}
                            </>
                        )}

                        {/* TAB 2: PERSISTENT SAVED FAVORITES */}
                        {activeTab === 'FAVORITES' && (
                            <>
                                {favorites.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                                        <p style={{ fontSize: '14px', color: '#b3b3b3', margin: '0 0 5px 0' }}>Your recipe book is empty.</p>
                                        <p style={{ fontSize: '12px', color: '#7f8c8d', fontStyle: 'italic', margin: 0 }}>Tap the star on an AI menu selection to pin it here.</p>
                                    </div>
                                ) : (
                                    favorites.map(fav => (
                                        <div
                                            key={fav.id}
                                            onClick={() => { setAiRecipes(fav.recipe); setIsRecipeModalOpen(true); }}
                                            style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', maxHeight: '180px', overflow: 'hidden', position: 'relative' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            {/* Star on Favorite Card to allow quick unfavoriting */}
                                            <button
                                                onClick={(e) => handleToggleFavourite(e, fav.recipe)}
                                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', zIndex: 10 }}
                                                title="Remove from Favorites"
                                            >
                                                ⭐
                                            </button>

                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#ffffff', fontWeight: 'bold', paddingRight: '25px' }}>{fav.recipe.title}</h4>
                                            {fav.recipe.prepTimeMinutes && <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '8px' }}>⏱️ Prep: {fav.recipe.prepTimeMinutes} mins</div>}
                                            <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{fav.recipe.instructions}</div>
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, rgba(25, 25, 30, 0.95))', pointerEvents: 'none' }} />
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                    </div>
                </aside>

                {/* --- AI RECIPE DETAILS POPUP WINDOW --- */}
                {isRecipeModalOpen && aiRecipes && (
                    <div
                        onClick={() => setIsRecipeModalOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1100
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: '#1c1c24',
                                padding: '30px',
                                borderRadius: '12px',
                                width: '550px',
                                maxWidth: '90vw',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setIsRecipeModalOpen(false)}
                                title="Close window"
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '20px',
                                    backgroundColor: 'transparent',
                                    color: '#a0a0a0',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '24px',
                                    fontWeight: '300',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                            >
                                ×
                            </button>

                            <h3 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '22px', paddingRight: '30px' }}>
                                {aiRecipes.title}
                            </h3>

                            {aiRecipes.prepTimeMinutes && (
                                <div style={{ fontSize: '13px', color: '#9b59b6', fontWeight: 'bold', marginBottom: '20px' }}>
                                    ⏱️ Estimated Preparation: {aiRecipes.prepTimeMinutes} minutes
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2ecc71', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Cooking Instructions:
                                </h5>
                                <p style={{ margin: 0, fontSize: '14px', color: '#e0e0e0', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                                    {aiRecipes.instructions}
                                </p>
                            </div>

                            {aiRecipes.nutritionInfo && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '20px', fontSize: '13px', color: '#95a5a6', fontStyle: 'italic' }}>
                                    🌱 Macros: {aiRecipes.nutritionInfo}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* --- SLIDING LEFT SIDE PROFILE DRAWER (30% Width) --- */}
            {isDrawerOpen && (
                <div
                    onClick={() => setIsDrawerOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(3px)',
                        zIndex: 1200,
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '30vw',
                            minWidth: '320px',
                            backgroundColor: '#16161e',
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '10px 0 40px rgba(0,0,0,0.5)',
                            padding: '30px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            color: '#ffffff',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                                Dietary Profile
                            </h3>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#a0a0a0', fontSize: '22px', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: '#9b59b6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Allergies
                                </label>
                                <textarea
                                    value={Array.isArray(preferences.allergies) ? preferences.allergies.join(', ') : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPreferences(prev => ({ ...prev, allergies: val.split(',').map(s => s.trim()) }))}
                                    }
                                    placeholder="e.g., Peanuts, Dairy, Shellfish..."
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        minHeight: '80px',
                                        resize: 'none',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.4'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', color: '#9b59b6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Dietary Focus
                                </label>
                                <textarea
                                    value={preferences.dietFocus}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, dietFocus: e.target.value }))}
                                    placeholder="e.g., High-Protein, Low-Carb, Ketogenic, Vegan..."
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        minHeight: '80px',
                                        resize: 'none',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.4'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: 'auto' }}>
                            <button
                                onClick={handleSavePreferences}
                                disabled={isSavingPrefs}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 5px rgba(39,174,96,0.2)',
                                    transition: 'background-color 0.2s',
                                    opacity: isSavingPrefs ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => { if(!isSavingPrefs) e.currentTarget.style.backgroundColor = '#219653'; }}
                                onMouseLeave={(e) => { if(!isSavingPrefs) e.currentTarget.style.backgroundColor = '#27ae60'; }}
                            >
                                {isSavingPrefs ? '💾 Saving Profiles...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD ITEM INTERACTIVE FORM WINDOW (MODAL) --- */}
            {isModalOpen && (
                <div style={modalOverlay}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Add Ingredient to Inventory</h3>

                        <form onSubmit={handleAddNewItem}>
                            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Ingredient Name</label>
                            <input type="text" placeholder="e.g. Garlic, Beef, Tomatoes" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} required />

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Quantity</label>
                                    <input type="number" step="any" min="0.1" value={newQuantity} onChange={e => setNewQuantity(parseFloat(e.target.value) || 0)} style={inputStyle} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Unit Type</label>
                                    <select value={newUnit} onChange={e => setNewUnit(e.target.value as UnitType)} style={inputStyle}>
                                        <option value="GRAM">GRAM</option>
                                        <option value="KILOGRAM">KILOGRAM</option>
                                        <option value="MILLILITRE">MILLILITRE</option>
                                        <option value="LITRE">LITRE</option>
                                        <option value="PIECE">PIECE</option>
                                        <option value="SLICE">SLICE</option>
                                        <option value="CLOVE">CLOVE</option>
                                        <option value="TEASPOON">TEASPOON</option>
                                        <option value="TABLESPOON">TABLESPOON</option>
                                        <option value="CUP">CUP</option>
                                    </select>
                                </div>
                            </div>

                            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Expiration Date</label>
                            <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={inputStyle} required />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Confirm Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Dashboard;