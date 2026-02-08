import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, List, Plus, X } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import GroceryListBuilder from './components/GroceryListBuilder';
import ListDetails from './components/ListDetails';
import './App.css';

/* 
  Dashboard Component 
  - Handles switching between Profile and Lists tabs
  - Displays the FAB and Modals
*/
const Dashboard = ({ user, serverMessage, onLogout }) => {
  const [activeTab, setActiveTab] = useState('Lists');
  const [showBuilder, setShowBuilder] = useState(false);
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedList, setSelectedList] = useState(null);

  // Fetch lists when tab is 'Lists'
  useEffect(() => {
    if (activeTab === 'Lists') {
      fetchLists();
    }
  }, [activeTab]);

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/grocery', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLists(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch lists', err);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleListCreated = () => {
    setShowBuilder(false);
    fetchLists(); // Refresh lists
    setActiveTab('Lists');
  };

  return (
    <div className="app-container">
      {/* Sidebar / Header */}
      <header className="app-header">
        <div className="logo-container">
          <img src="/logo.png" alt="Forgetti-List Logo" className="logo-img" />
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'Lists' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('Lists');
              setSelectedList(null);
            }}
          >
            <List size={20} />
            Lists
          </button>
          <button
            className={`nav-tab ${activeTab === 'Profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('Profile')}
          >
            <User size={20} />
            Profile
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="dashboard-header">
          <img src="/logo.png" alt="Logo" className="header-logo" />
          <div className="user-profile-pill" onClick={() => setActiveTab('Profile')}>
            <span className="user-name">{user.username}</span>
            <div className="avatar-circle">
              <User size={20} color="#7C3AED" />
            </div>
          </div>
        </div>

        {activeTab === 'Lists' && !selectedList && (
          <div className="lists-view">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: '#1F2937' }}>My Grocery Lists</h2>
              <p className="text-gray">Manage your shopping efficiently.</p>
            </div>

            {loadingLists ? (
              <p className="text-center text-gray">Loading lists...</p>
            ) : lists.length > 0 ? (
              <div className="lists-grid">
                {lists.map(list => (
                  <div key={list._id} className="grocery-list-item" onClick={() => setSelectedList(list)}>
                    <span className="list-name">{list.name}</span>
                    <div className="list-meta">
                      <span>{list.items.length} Items</span>
                      <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray" style={{ marginTop: '4rem' }}>
                <div style={{ background: '#F3F4F6', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <List size={40} color="#9CA3AF" />
                </div>
                <h3 style={{ color: '#374151', margin: '0 0 0.5rem 0' }}>No lists yet</h3>
                <p>Click the + button below to create your first list!</p>
              </div>
            )}

            {/* Floating Action Button */}
            <div className="fab-container">
              <button className="fab" onClick={() => setShowBuilder(true)}>
                <Plus size={32} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Lists' && selectedList && (
          <ListDetails list={selectedList} onBack={() => setSelectedList(null)} />
        )}

        {activeTab === 'Profile' && (
          <div className="profile-view">
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{
                width: '100px', height: '100px', background: '#E5E7EB',
                borderRadius: '50%', margin: '0 auto 1rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={48} color="#9CA3AF" />
              </div>
              <h2 style={{ margin: '0' }}>{user.username}</h2>
              <p className="text-gray">{user.email}</p>

              <div style={{ marginTop: '2rem' }}>
                <button onClick={onLogout} className="btn-primary" style={{ backgroundColor: '#EF4444' }}>
                  Logout
                </button>
              </div>

              <div style={{ marginTop: '4rem', fontSize: '0.9rem', color: '#9CA3AF' }}>
                <p>Backend Status: <span style={{ color: serverMessage && serverMessage !== 'Backend not connected' ? '#10B981' : '#EF4444' }}>{serverMessage || 'Checking...'}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showBuilder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowBuilder(false)}>
              <X size={24} />
            </button>
            <GroceryListBuilder onListCreated={handleListCreated} />
          </div>
        </div>
      )}
    </div>
  );
};

/* Main App Wrapper */
function App() {
  const [serverMessage, setServerMessage] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    // Check backend
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setServerMessage(data))
      .catch(err => setServerMessage('Backend not connected'));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Signup onLogin={handleLogin} />} />
      <Route path="/" element={
        user ? (
          <Dashboard user={user} serverMessage={serverMessage} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} /> // Default to login if not authenticated
        )
      } />
    </Routes>
  );
}

export default App;
