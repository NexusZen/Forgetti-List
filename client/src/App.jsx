import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import GroceryListBuilder from './components/GroceryListBuilder';
import './App.css';

function App() {
  const [serverMessage, setServerMessage] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch data from the backend to verify connection
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setServerMessage(data))
      .catch(err => {
        console.error('Error connecting to backend:', err);
        setServerMessage('Backend not connected');
      });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Forgetti-List</h1>
        {user ? (
          <div className="user-info">
            <span>Welcome, {user.username}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        ) : (
          <nav className="nav-links">
            {/* Links could go here if needed */}
          </nav>
        )}
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Signup onLogin={handleLogin} />} />
          <Route path="/" element={
            user ? (
              <div className="dashboard-container">
                <div className="card dashboard-card">
                  <h2>Your Dashboard</h2>
                  <p className="welcome-text">You are logged in as <strong>{user.email}</strong></p>
                </div>

                <GroceryListBuilder />

                <div className="card backend-status-mini">
                  <p>Backend Status:
                    <span className={serverMessage && serverMessage !== 'Backend not connected' ? 'status-text online' : 'status-text offline'}>
                      {serverMessage || 'Connecting...'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="landing-content">
                <h2>Welcome to proper task management.</h2>
                <p>Stop forgetting. Start organizing.</p>
                <div className="cta-container">
                  <Link to="/login" className="btn-primary">Login</Link>
                  <Link to="/register" className="btn-secondary">Get Started</Link>
                </div>
              </div>
            )
          } />
        </Routes>
      </main>

      <footer className="footer">
        <p>Created by Antigravity</p>
      </footer>
    </div>
  );
}

export default App;
