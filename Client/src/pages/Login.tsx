import { useState } from 'react';
import backgroundImageFile from '../assets/chef.jpg';

interface LoginProps {
    onLoginSuccess: () => void;
    onToggleView: () => void; // Callback to switch to Register view
}

function Login({ onLoginSuccess, onToggleView }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid email or password');
            }

            const data = await response.json();
            localStorage.setItem('fridgeai_token', data.token);
            onLoginSuccess();
        } catch (error: any) {
            alert(error.message || 'Login failed. Please try again.');
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
    const loginCard: React.CSSProperties = {
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        boxSizing: 'border-box'
    };
    return (
        <div style={fullscreenContainer}>
            <div style={loginCard}>
                <h2>FridgeAI Login</h2>
                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="login-email" style={{ display: 'block', marginBottom: '5px' }}>Email Address:</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mared@tum.de"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="login-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#0065BD', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Sign In
                    </button>
                </form>
                <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '10px' }}>
                    Don't have an account yet?{' '}
                    <span
                        onClick={onToggleView}
                        style={{ color: '#0065BD', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Register here
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Login;