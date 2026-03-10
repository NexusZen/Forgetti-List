import { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, List, Plus, X, Trash, Sun, Moon, Trophy, LogOut, ChevronLeft, ChevronRight, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import GroceryListBuilder from './components/GroceryListBuilder';
import ListDetails from './components/ListDetails';
import Leaderboard from './components/Leaderboard';
import './App.css';

/* ============================================================
   ListsDashboard — Lumen Focus-style main view
   ============================================================ */
const ListsDashboard = ({ lists, loadingLists, cooldown, randomWelcome, exitingIds, setSelectedList, requestDeleteList, setShowBuilder }) => {
  const [unlockAnimating, setUnlockAnimating] = useState(false);
  const prevCooldown = useRef(cooldown);

  // Detect countdown finishing → trigger unlock animation
  useEffect(() => {
    if (prevCooldown.current > 0 && cooldown === 0) {
      setUnlockAnimating(true);
      setTimeout(() => setUnlockAnimating(false), 900);
    }
    prevCooldown.current = cooldown;
  }, [cooldown]);

  // Split lists into active (pending items) and completed
  const activeLists = lists.filter(l => {
    if (!l.items || l.items.length === 0) return true;
    return l.items.some(item => item.puzzle && item.puzzle.status === 'pending');
  });

  const completedLists = lists.filter(l => {
    if (!l.items || l.items.length === 0) return false;
    return l.items.every(item => !item.puzzle || item.puzzle.status !== 'pending');
  });

  // The "current task" is the first active list
  const currentList = activeLists[0] || null;

  // Total items across all lists
  const totalItems = lists.reduce((sum, l) => sum + (l.items ? l.items.length : 0), 0);

  const getListStatus = (list) => {
    if (!list.items || list.items.length === 0) return { color: '#7C3AED', label: 'EMPTY' };
    const total = list.items.length;
    const pending = list.items.filter(i => i.puzzle && i.puzzle.status === 'pending').length;
    const failed = list.items.filter(i => i.puzzle && i.puzzle.status === 'failed').length;
    if (pending > 0) return { color: '#7C3AED', label: 'IN PROGRESS' };
    if (failed === 0) return { color: '#10B981', label: 'COMPLETED' };
    return { color: '#EF4444', label: 'FINISHED' };
  };

  return (
    <div className="fd-dashboard">
      {/* ── Top: Logo & Quote ── */}
      <div className="fd-top">
        <img src="/logo.png" alt="Forgetti-List" className="fd-logo" />
        <p className="fd-quote">{randomWelcome}</p>
      </div>

      {/* ── Timer Badge ── */}
      <div className="fd-timer-wrap">
        {cooldown > 0 ? (
          <div className="fd-timer-badge fd-timer-active">
            <Clock size={14} />
            <span>Brain Cooldown: <strong>{cooldown}s</strong></span>
          </div>
        ) : (
          <div className={`fd-timer-badge fd-timer-ready ${unlockAnimating ? 'fd-unlock-pop' : ''}`}>
            <CheckCircle2 size={14} />
            <span>Ready to go!</span>
          </div>
        )}
      </div>

      {/* ── Centre row: Circle + Count ── */}
      <div className="fd-centre-row">
        {/* SVG Circle */}
        <div className="fd-circle-wrap">
          <svg className="fd-circle-svg" viewBox="0 0 220 220">
            {/* Outer decorative ring */}
            <circle cx="110" cy="110" r="104" fill="none" stroke="var(--border-color)" strokeWidth="2" />
            {/* Progress arc – purple */}
            <circle
              cx="110" cy="110" r="92"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="578"
              strokeDashoffset={cooldown > 0 ? 578 * (cooldown / 60) : 0}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            {/* Inner fill */}
            <circle cx="110" cy="110" r="78" fill="var(--surface-color)" />
          </svg>

          {/* Text inside circle */}
          <div className="fd-circle-inner">
            {loadingLists ? (
              <span className="fd-circle-sub">Loading…</span>
            ) : currentList ? (
              <>
                <span className="fd-circle-label">CURRENT LIST</span>
                <span className="fd-circle-task">{currentList.name}</span>
                <span className="fd-circle-sub">{currentList.items?.length || 0} items</span>
              </>
            ) : lists.length === 0 ? (
              <>
                <span className="fd-circle-label">NO LISTS YET</span>
                <span className="fd-circle-task" style={{ fontSize: '1rem' }}>Create your</span>
                <span className="fd-circle-task" style={{ fontSize: '1rem' }}>first list!</span>
              </>
            ) : (
              <>
                <span className="fd-circle-label">ALL DONE</span>
                <span className="fd-circle-sub">Nothing pending</span>
              </>
            )}
          </div>
        </div>

        {/* Count badge beside circle */}
        <div className="fd-count-panel">
          <div className="fd-count-card">
            <ShoppingBag size={22} color="var(--primary)" />
            <span className="fd-count-number">{lists.length}</span>
            <span className="fd-count-label">Lists</span>
          </div>
          <div className="fd-count-card">
            <List size={22} color="#10B981" />
            <span className="fd-count-number">{totalItems}</span>
            <span className="fd-count-label">Total Items</span>
          </div>
          <div className="fd-count-card">
            <CheckCircle2 size={22} color="#F59E0B" />
            <span className="fd-count-number">{completedLists.length}</span>
            <span className="fd-count-label">Completed</span>
          </div>
        </div>
      </div>

      {/* ── Create List Button ── */}
      <div className="fd-action-row">
        <button
          id="fd-create-btn"
          className={`fd-create-btn ${cooldown > 0 ? 'fd-btn-locked' : 'fd-btn-ready'} ${unlockAnimating ? 'fd-unlock-pop' : ''}`}
          disabled={cooldown > 0}
          onClick={() => setShowBuilder(true)}
          title={cooldown > 0 ? `Wait ${cooldown}s before creating a new list` : 'Create a new list'}
        >
          <Plus size={20} strokeWidth={2.5} />
          {cooldown > 0 ? `Create New List  (${cooldown}s)` : 'Create New List'}
        </button>
      </div>

      {/* ── Active / In-Progress Lists ── */}
      {activeLists.length > 0 && (
        <div className="fd-section">
          <h3 className="fd-section-title">Active Lists</h3>
          <div className={`fd-queue ${cooldown > 0 ? 'fd-queue-locked' : ''}`}>
            {cooldown > 0 && (
              <div className="fd-cooldown-overlay">
                <Clock size={20} />
                <span>Lists locked during brain cooldown ({cooldown}s remaining)</span>
              </div>
            )}
            {activeLists.map(list => {
              const st = getListStatus(list);
              return (
                <div
                  key={list._id}
                  className={`fd-queue-item ${exitingIds.includes(list._id) ? 'exiting' : ''} ${cooldown > 0 ? 'fd-item-locked' : ''}`}
                  onClick={() => cooldown === 0 && setSelectedList(list)}
                  style={{ '--q-color': st.color }}
                >
                  <div className="fd-queue-icon">
                    <ShoppingBag size={18} color={cooldown > 0 ? '#6B7280' : st.color} />
                  </div>
                  <div className="fd-queue-info">
                    <span className="fd-queue-name">{list.name}</span>
                    <span className="fd-queue-meta">{list.items.length} items · {new Date(list.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="fd-queue-status" style={{ color: cooldown > 0 ? '#6B7280' : st.color }}>{cooldown > 0 ? 'LOCKED' : st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Completed Lists ── */}
      {completedLists.length > 0 && (
        <div className="fd-section">
          <h3 className="fd-section-title">Completed Lists</h3>
          <div className="fd-queue">
            {completedLists.map(list => {
              const st = getListStatus(list);
              return (
                <div
                  key={list._id}
                  className={`fd-queue-item fd-queue-done ${exitingIds.includes(list._id) ? 'exiting' : ''} ${cooldown > 0 ? 'fd-item-locked' : ''}`}
                  onClick={() => cooldown === 0 && setSelectedList(list)}
                  style={{ '--q-color': st.color }}
                >
                  <div className="fd-queue-icon">
                    <CheckCircle2 size={18} color={st.color} />
                  </div>
                  <div className="fd-queue-info">
                    <span className="fd-queue-name">{list.name}</span>
                    <span className="fd-queue-meta">{list.items.length} items · {new Date(list.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="fd-queue-right">
                    <span className="fd-queue-status" style={{ color: st.color }}>{st.label}</span>
                    <button
                      className="fd-delete-btn"
                      onClick={(e) => requestDeleteList(e, list._id)}
                      title="Delete list"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loadingLists && lists.length === 0 && (
        <div className="fd-empty">
          <div className="fd-empty-icon"><List size={40} color="#9CA3AF" /></div>
          <h3>No lists yet</h3>
          <p>Create your first list to get started!</p>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   Dashboard Component
   - Handles switching between Profile and Lists tabs
   - Displays the FAB and Modals
   ============================================================ */
const Dashboard = ({ user, serverMessage, onLogout, theme, onToggleTheme, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('Lists');
  const [showBuilder, setShowBuilder] = useState(false);
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);

  const [exitingIds, setExitingIds] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('http://localhost:5000/api/auth/avatar', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success && onUpdateUser) {
        const updated = { ...user, avatarUrl: data.avatarUrl };
        onUpdateUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

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
    setCooldown(60); // 60-second cooldown
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <header className="app-header">
        <div className="logo-container">
          <img src="/small_logo.png" alt="Forgetti-List" className="sidebar-logo-small" />
          <img src="/logo.png" alt="Forgetti-List" className="sidebar-logo-full" />
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
            <List size={24} />
            <span>Lists</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'Leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Leaderboard')}
            title="Leaderboard"
          >
            <Trophy size={24} />
            <span>Leaderboard</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'Profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('Profile')}
            title="Profile"
          >
            <User size={24} />
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <button className="sidebar-user-item" onClick={onToggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            <span className="sidebar-details">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Logout */}
          <button className="sidebar-user-item" onClick={onLogout} title="Logout">
            <LogOut size={24} />
            <span className="sidebar-details">Logout</span>
          </button>

          {/* User Profile */}
          <div className="sidebar-user-item" style={{ marginTop: '0.5rem', background: 'var(--surface-hover)', cursor: 'default' }}>
            <div className="avatar-circle" style={{ width: '32px', height: '32px', minWidth: '32px', overflow: 'hidden', padding: 0 }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <User size={18} color="#7C3AED" />}
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
          <ListsDashboard
            lists={lists}
            loadingLists={loadingLists}
            cooldown={cooldown}
            randomWelcome={randomWelcome}
            exitingIds={exitingIds}
            setSelectedList={setSelectedList}
            requestDeleteList={requestDeleteList}
            setShowBuilder={setShowBuilder}
          />
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
              {/* Avatar Upload */}
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => uploadAvatar(e.target.files[0])}
              />
              <div
                className="profile-avatar-wrap"
                onClick={() => !uploadingAvatar && avatarFileRef.current?.click()}
                title="Click to change profile picture"
              >
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.username} className="profile-avatar-img" />
                  : <User size={48} color="var(--primary)" />}
                <div className="profile-avatar-overlay">
                  {uploadingAvatar ? '⏳' : '📷'}
                </div>
              </div>
              <h2 style={{ margin: '0.5rem 0 0', color: 'var(--text-dark)' }}>{user.username}</h2>
              <p className="text-gray" style={{ marginBottom: '2rem', fontSize: '0.85rem' }}>Click avatar to change photo</p>

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
