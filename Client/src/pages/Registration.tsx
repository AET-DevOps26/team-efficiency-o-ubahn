import { useState } from 'react';
import backgroundImageFile from '../assets/chef.jpg';

interface RegisterProps {
    onRegisterSuccess: () => void;
    onToggleView: () => void; // Callback to switch back to Login view
}

function Register({ onRegisterSuccess, onToggleView }: RegisterProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        console.log('Saving mock registration to localStorage...', { username, email });
        localStorage.setItem('mock_registered_email', email);
        localStorage.setItem('mock_registered_password', password);
        localStorage.setItem('mock_registered_username', username);

        /*
        try {
          const response = await fetch('http://localhost:8081/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });

          if (!response.ok) {
            throw new Error('Registration failed');
          }

          alert('Registration successful! Redirecting to login...');
          onRegisterSuccess();
          return;
        } catch (error: any) {
          console.error('Production registration failed:', error);
          alert(error.message || 'Server error connection failed.');
          return;
        }
        */

        alert('Mock Registration Successful! Account Created.');
        onRegisterSuccess();
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
                        <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="mared_prime"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Email Address:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mared@tum.de"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#0065BD', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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