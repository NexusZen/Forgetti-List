import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, List, Plus, X, Trash, Sun, Moon } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import GroceryListBuilder from './components/GroceryListBuilder';
import ListDetails from './components/ListDetails';
import './App.css';

/* ... imports remain same ... */

/* 
  Dashboard Component 
  - Handles switching between Profile and Lists tabs
  - Displays the FAB and Modals
*/
const Dashboard = ({ user, serverMessage, onLogout, theme, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState('Lists');
  const [showBuilder, setShowBuilder] = useState(false);
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);

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

  // Trigger modal
  const requestDeleteList = (e, listId) => {
    e.stopPropagation();
    setListToDelete(listId);
  };

  // Perform delete
  const confirmDelete = async () => {
    if (!listToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/grocery/${listToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setLists(prev => prev.filter(l => l._id !== listToDelete));
        setListToDelete(null); // Close modal
      } else {
        alert(data.message || "Failed to delete list");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting list");
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

          <button
            onClick={onToggleTheme}
            style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '1rem',
              color: 'var(--text-dark)',
              transition: 'all 0.2s'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

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
              <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: 'var(--text-dark)' }}>My Grocery Lists</h2>
              <p className="text-gray">Manage your shopping efficiently.</p>
            </div>

            {loadingLists ? (
              <p className="text-center text-gray">Loading lists...</p>
            ) : lists.length > 0 ? (
              <div className="lists-grid">
                {lists.map(list => {
                  // Calculate Status
                  let total = 0;
                  let solved = 0;
                  let failed = 0;
                  let pending = 0;

                  if (list.items && Array.isArray(list.items)) {
                    total = list.items.length;
                    list.items.forEach(item => {
                      if (item.puzzle) {
                        if (item.puzzle.status === 'solved') solved++;
                        else if (item.puzzle.status === 'failed') failed++;
                        else pending++;
                      } else {
                        // Default legacy items as pending or ignore? 
                        // Assuming pending for safety to keep it Purple if not valid
                        pending++;
                      }
                    });
                  }

                  let borderColor = '#7C3AED'; // Purple (Default/In Progress)

                  if (total > 0 && pending === 0) {
                    if (failed === 0) {
                      borderColor = '#10B981'; // Green (Perfect)
                    } else {
                      borderColor = '#EF4444'; // Red (Finished but with errors)
                    }
                  }

                  return (
                    <div
                      key={list._id}
                      className="grocery-list-item"
                      onClick={() => setSelectedList(list)}
                      style={{ '--status-color': borderColor }}
                    >
                      <span className="list-name">{list.name}</span>
                      <div className="list-meta">
                        <span>{list.items.length} Items</span>
                        <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                      </div>
                      {total > 0 && pending === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: borderColor }}>
                            {failed === 0 ? 'COMPLETED' : 'FINISHED'}
                          </div>
                          <button
                            className="btn-delete-list"
                            onClick={(e) => requestDeleteList(e, list._id)}
                            title="Delete List"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#FEE2E2'}
                            onMouseLeave={(e) => e.target.style.background = 'none'}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
          <ListDetails
            list={selectedList}
            onBack={() => {
              setSelectedList(null);
              fetchLists(); // Refresh data to show updated status/colors
            }}
          />
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

      {/* Delete Confirmation Modal */}
      {listToDelete && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', background: '#FEE2E2',
                color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Trash size={32} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#1F2937' }}>Delete List?</h3>
              <p style={{ color: '#6B7280', margin: 0 }}>
                Are you sure you want to remove this completed list? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setListToDelete(null)}
                style={{
                  padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #D1D5DB',
                  background: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none',
                  background: '#EF4444', color: 'white', fontWeight: '600', cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
                  fontSize: '1rem'
                }}
              >
                Delete
              </button>
            </div>
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
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();

  useEffect(() => {
    // Load theme from local storage or prefer-color-scheme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Check server status
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
          <Dashboard
            user={user}
            serverMessage={serverMessage}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        ) : (
          <Login onLogin={handleLogin} /> // Default to login if not authenticated
        )
      } />
    </Routes>
  );
}

export default App;
