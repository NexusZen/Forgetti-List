import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, List, Plus, X, Trash, Sun, Moon, Trophy, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import GroceryListBuilder from './components/GroceryListBuilder';
import ListDetails from './components/ListDetails';
import Leaderboard from './components/Leaderboard';
import './App.css';

/* ... imports remain same ... */

/* 
  Dashboard Component 
  - Handles switching between Profile and Lists tabs
  - Displays the FAB and Modals
*/
const Dashboard = ({ user, serverMessage, onLogout, theme, onToggleTheme, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('Lists');
  const [showBuilder, setShowBuilder] = useState(false);
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [exitingIds, setExitingIds] = useState([]);

  const randomWelcome = useMemo(() => {
    const messages = [
      `Another day of suffering, ${user.username}!`,
      `I'm sure you're happy to be back, ${user.username}.`,
      `Welcome to the world's most pointless list, ${user.username}!`,
      `Ready to complicate your life, ${user.username}?`,
      `Oh look, it's ${user.username} again...`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [user.username]);

  // Fetch lists when tab is 'Lists'
  useEffect(() => {
    if (activeTab === 'Lists') {
      fetchLists();
    }
  }, [activeTab]);

  /* Fetch Lists without full reload flicker */
  const fetchLists = async () => {
    // Only show loading state if we have no lists (initial load)
    if (lists.length === 0) {
      setLoadingLists(true);
    }

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
      if (lists.length === 0) {
        setLoadingLists(false);
      }
    }
  };

  // Trigger modal
  const requestDeleteList = (e, listId) => {
    e.stopPropagation();
    setListToDelete(listId);
  };

  // Perform delete
  /* Animated Delete Handler */
  const confirmDelete = async () => {
    if (!listToDelete) return;
    const id = listToDelete;

    // Start exit animation and close modal immediately
    setExitingIds(prev => [...prev, id]);
    setListToDelete(null);

    // Wait for animation (400ms) before actual deletion/removal
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/grocery/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          setLists(prev => prev.filter(l => l._id !== id));
          // Optional: fetchLists(); to sync points/stats if server side logic updated user
          // But for smooth removal, local filter is enough. 
          // We can fetch user points separately if needed.
          // fetchLists(); // Maybe delay this further or skip?
        } else {
          alert(data.message || "Failed to delete list");
          fetchLists(); // Restore
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert("Error deleting list");
        fetchLists();
      } finally {
        setExitingIds(prev => prev.filter(eid => eid !== id));
      }
    }, 400);
  };

  const handleListCreated = () => {
    setShowBuilder(false);
    fetchLists(); // Refresh lists
    setActiveTab('Lists');
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <header className="app-header">
        <div className="logo-container" style={{ margin: 0, paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <img
            src={isSidebarCollapsed ? "/small_logo.png" : "/logo.png"}
            alt="Forgetti-List"
            className={isSidebarCollapsed ? "logo-collapsed" : ""}
            style={{
              height: isSidebarCollapsed ? '40px' : '80px',
              width: 'auto',
              maxWidth: '100%',
              transition: 'all 0.3s',
              objectFit: 'contain'
            }}
          />
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--surface-color)', border: '1px solid var(--border-color)',
              borderRadius: '50%', padding: '4px', cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} color="var(--text-dark)" /> : <ChevronLeft size={14} color="var(--text-dark)" />}
          </button>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'Lists' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('Lists');
              setSelectedList(null);
            }}
            title="My Lists"
          >
            <List size={20} />
            <span>Lists</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'Leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Leaderboard')}
            title="Leaderboard"
          >
            <Trophy size={20} />
            <span>Leaderboard</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('Profile')}
            title="Profile"
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <button className="sidebar-user-item" onClick={onToggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="sidebar-details">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Logout */}
          <button className="sidebar-user-item" onClick={onLogout} title="Logout">
            <LogOut size={20} />
            <span className="sidebar-details">Logout</span>
          </button>

          {/* User Profile */}
          <div className="sidebar-user-item" style={{ marginTop: '0.5rem', background: 'var(--surface-hover)', cursor: 'default' }}>
            <div className="avatar-circle" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
              <User size={16} color="#7C3AED" />
            </div>
            <div className="sidebar-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{user.username}</span>
              <span style={{ fontSize: '0.75rem', color: 'gray' }}>{user.points || 0} pts</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">

        {activeTab === 'Lists' && !selectedList && (
          <div className="lists-view">
            <div style={{ marginBottom: '2rem' }}>
              <img src="/logo.png" alt="Forgetti-List" style={{ width: '300px', maxWidth: '100%', display: 'block', marginBottom: '1rem' }} />
              <p style={{
                fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: '600',
                color: 'var(--primary)', fontStyle: 'italic'
              }}>
                {randomWelcome}
              </p>
              <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: 'var(--text-dark)' }}>My Grocery Lists</h2>
            </div>

            <div className="lists-box">
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
                        className={`grocery-list-item ${exitingIds.includes(list._id) ? 'exiting' : ''}`}
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

              <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 10 }}>
                <button className="fab" onClick={() => setShowBuilder(true)}>
                  <Plus size={32} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Lists' && selectedList && (
          <ListDetails
            list={selectedList}
            theme={theme}
            onBack={() => {
              setSelectedList(null);
              fetchLists(); // Refresh data to show updated status/colors
            }}
            onUpdatePoints={(newPoints) => {
              if (onUpdateUser) {
                const updatedUser = { ...user, points: newPoints };
                onUpdateUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist locally!
              }
            }}
          />
        )}

        {activeTab === 'Leaderboard' && (
          <Leaderboard />
        )}

        {activeTab === 'Profile' && (
          <div className="profile-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '2rem' }}>
            <div className="lists-box" style={{ width: '100%', maxWidth: '600px', textAlign: 'center', minHeight: 'auto', paddingBottom: '3rem' }}>
              <div style={{
                width: '100px', height: '100px', background: 'var(--card-bg)',
                borderRadius: '50%', margin: '0 auto 1rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={48} color="var(--primary)" />
              </div>
              <h2 style={{ margin: '0', color: 'var(--text-dark)' }}>{user.username}</h2>
              <p className="text-gray" style={{ marginBottom: '2rem' }}>{user.email}</p>

              <div className="profile-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                margin: '0 auto 3rem',
                maxWidth: '400px'
              }}>
                <div style={{
                  background: 'var(--card-bg)',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.2rem' }}>{user.points || 0}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.8 }}>Total Points</div>
                </div>

                <div style={{
                  background: 'var(--card-bg)',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981', marginBottom: '0.2rem' }}>{user.puzzlesSolved || 0}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.8 }}>Puzzles Solved</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '2rem' }}>
                <button onClick={onLogout} className="btn-primary" style={{ backgroundColor: '#EF4444', padding: '0.8rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={18} />
                  Logout
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', opacity: 0.6 }}>
                Backend Status: <span style={{ color: serverMessage && serverMessage !== 'Backend not connected' ? '#10B981' : '#EF4444' }}>{serverMessage || 'Checking...'}</span>
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
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text-dark)' }}>Delete List?</h3>
              <p style={{ color: 'var(--text-dark)', opacity: 0.7, margin: 0 }}>
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

      // Fetch fresh user data (points, puzzlesSolved)
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));
          }
        })
        .catch(err => console.error("Failed to refresh user data", err));
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
            onUpdateUser={setUser}
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
