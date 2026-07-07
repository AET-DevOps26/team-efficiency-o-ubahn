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
    id: string;
    title: string;
    matchPercentage: number;
    missedIngredients: string[];
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
    const [isGeneratingRecipes, setIsGeneratingRecipes] = useState<boolean>(false);
    const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);

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
            expiryDate: newExpiry, // YYYY-MM-DD — maps to the backend LocalDate
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

            const data: Recipe[] = await response.json();
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
        width: '100%', // Makes navbar span the entire top screen width
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
                <h2 style={{ margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>FridgeAI Control Panel</h2>
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
                            marginBottom: '20px',
                            boxShadow: '0 2px 5px rgba(155,89,182,0.3)',
                            opacity: isGeneratingRecipes ? 0.7 : 1
                        }}
                    >
                        {isGeneratingRecipes ? '🔄 Syncing AI Menu...' : '✨ Auto-Generate Meals'}
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {aiRecipes.length === 0 && !isGeneratingRecipes && (
                            <p style={{ fontSize: '14px', color: '#b3b3b3', textAlign: 'center', marginTop: '10px' }}>
                                No meals generated yet.
                            </p>
                        )}
                        {aiRecipes.map(recipe => (
                            <div key={recipe.id} style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff' }}>{recipe.title}</h5>
                                <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>
                                    Match Rating: {recipe.matchPercentage}%
                                </div>
                                {recipe.missedIngredients.length > 0 && (
                                    <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '6px' }}>
                                        Missing: {recipe.missedIngredients.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </main>

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