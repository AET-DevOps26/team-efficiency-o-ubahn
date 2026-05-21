import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
    // On app startup, check if a user is already logged in from a previous session
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const token = localStorage.getItem('fridgeai_token');
        return token !== null; // Returns true if token exists, false otherwise
    });

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };
    return (
         <div> {isAuthenticated ? (
             <Dashboard />
         ): (
             <Login onLoginSuccess={handleLoginSuccess} />
         )}
         </div>
    );
}

export default App;