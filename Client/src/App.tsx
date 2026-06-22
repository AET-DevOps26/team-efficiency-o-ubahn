import { useState } from 'react';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';

function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(part));
        return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

function App() {

    const [view, setView] = useState<'login' | 'register'>('login');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const token = localStorage.getItem('fridgeai_token');
        if (isTokenValid(token)) return true;
        localStorage.removeItem('fridgeai_token');
        return false;
    });

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleRegisterSuccess = () => {
        // Automatically flip them back to the login card after successful mock registration
        setView('login');
    };

    return (
         <div> {isAuthenticated ? (
             <Dashboard />
         ) : (
             view ==='login' ? (
             <Login
                 onLoginSuccess={handleLoginSuccess}
                 onToggleView={() => setView('register')}
             />
         ) : (
             <Registration
                 onRegisterSuccess={handleRegisterSuccess}
                 onToggleView={() => setView('login')}    // Correctly flips view back to login
             />)
             )}
         </div>
    );
}

export default App;