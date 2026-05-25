import { useState } from 'react';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';

function App() {
    // On app startup, check if a user is already logged in from a previous session
    const [view, setView] = useState<'login' | 'register'>('login');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const token = localStorage.getItem('fridgeai_token');
        return token !== null; // Returns true if token exists, false otherwise
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