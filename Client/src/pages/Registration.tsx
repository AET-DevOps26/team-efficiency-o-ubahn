import { useState } from 'react';
import backgroundImageFile from '../assets/chef.jpg';

interface RegisterProps {
    onRegisterSuccess: () => void;
    onToggleView: () => void; // Callback to switch back to Login view
}

function Register({ onRegisterSuccess, onToggleView }: RegisterProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [allergiesInput, setAllergiesInput] = useState('');
    const [preferencesInput, setPreferencesInput] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const allergiesArray = allergiesInput
            .split(/[ ,]+/)
            .map(item => item.trim().toUpperCase())
            .filter(item => item.length > 0);

        const singlePreference = preferencesInput.trim().toUpperCase() || null;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, allergies: allergiesArray, preference: singlePreference}),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Registration failed');
            }

            alert('Registration successful! Please log in.');
            onRegisterSuccess();
        } catch (error: any) {
            alert(error.message || 'Registration failed. Please try again.');
        }
    };

    const fullscreenContainer: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${backgroundImageFile})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const registerCard: React.CSSProperties = {
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        boxSizing: 'border-box',
        color: '#ffffff' // Keeps text readable against the dark card opacity
    };

    return (
        <div style={fullscreenContainer}>
            <div style={registerCard}>
                <h2 style={{ marginTop: 0 }}>FridgeAI Register</h2>
                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="register-email" style={{ display: 'block', marginBottom: '5px', textAlign: 'center' }}>Email Address:</label>
                        <input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mared@tum.de"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textAlign: 'center' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="register-password" style={{ display: 'block', marginBottom: '5px', textAlign: 'center' }}>Password:</label>
                        <input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textAlign: 'center' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="register-confirm-password" style={{ display: 'block', marginBottom: '5px', textAlign: 'center' }}>Confirm Password:</label>
                        <input
                            id="register-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textAlign: 'center' }}
                        />
                    </div>

                    {/* Cleaned Up Allergies Section */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="register-allergies" style={{ display: 'block', marginBottom: '5px', textAlign: 'center' }}>Allergies:</label>
                        <input
                            id="register-allergies"
                            type="text"
                            value={allergiesInput}
                            onChange={(e) => setAllergiesInput(e.target.value)}
                            placeholder="Nuts, Dairy (separated by spaces or commas)"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textAlign: 'center' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="register-diet-focus" style={{ display: 'block', marginBottom: '5px', textAlign: 'center' }}>Dietary Preference:</label>
                        <input
                            id="register-diet-focus"
                            type="text"
                            value={preferencesInput}
                            onChange={(e) => setPreferencesInput(e.target.value)}
                            placeholder="e.g. Vegan, Keto, Halal"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textAlign: 'center' }}
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#0065BD', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Sign Up
                    </button>
                </form>

                <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '10px' }}>
                    Already have an account?{' '}
                    <span
                        onClick={onToggleView}
                        style={{ color: '#0065BD', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Login here
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Register;