import { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, List, Plus, X, Trash, Sun, Moon, Trophy, LogOut, ChevronLeft, ChevronRight, CheckCircle2, Clock, ShoppingBag, Pencil } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import GroceryListBuilder from './components/GroceryListBuilder';
import EditListModal from './components/EditListModal';
import ListDetails from './components/ListDetails';
import Leaderboard from './components/Leaderboard';
import './App.css';

/* ============================================================
   ListsDashboard — Lumen Focus-style main view
   ============================================================ */
const ListsDashboard = ({ lists, loadingLists, cooldown, randomWelcome, exitingIds, setSelectedList, requestDeleteList, requestEditList, setShowBuilder, theme }) => {
  const isDark = theme === 'dark';
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
      {/* ── Top: Premium Hero Header ── */}
      <div className="fd-hero">
        <div className="fd-hero-glow" />
        <div className="fd-hero-content">
          <img src={isDark ? '/logo_white.png' : '/logo.png'} alt="Forgetti-List" className="fd-logo" />
          <p className="fd-quote">{randomWelcome}</p>
        </div>
        <div className="fd-hero-accent" />
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
                  <div className="fd-queue-right">
                    <span className="fd-queue-status" style={{ color: cooldown > 0 ? '#6B7280' : st.color }}>{cooldown > 0 ? 'LOCKED' : st.label}</span>
                    {cooldown === 0 && (
                      <button
                        className="fd-edit-btn"
                        onClick={(e) => requestEditList(e, list)}
                        title="Edit list"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
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
   ProfileDashboard — User stats & activity dashboard
   ============================================================ */
const ProfileDashboard = ({ user, onUpdateUser, onLogout, serverMessage, uploadingAvatar, avatarFileRef, uploadAvatar, theme }) => {
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activityRange, setActivityRange] = useState('biweekly'); // 'biweekly' or 'monthly'

  const fetchStats = async (days) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/auth/stats?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const days = activityRange === 'biweekly' ? 14 : 30;
    fetchStats(days);
  }, [activityRange]);

  // Format join date
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  // Calculate retention percentage
  const totalAttempted = (stats?.puzzlesSolved || 0) + (stats?.puzzlesFailed || 0);
  const retentionPct = totalAttempted > 0
    ? Math.round((stats.puzzlesSolved / totalAttempted) * 100)
    : 0;

  // Max count for chart scaling
  const maxCount = stats?.activityDays
    ? Math.max(...stats.activityDays.map(d => d.count), 1)
    : 1;

  // Today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="pd-container">
      {/* ── Profile Header ── */}
      <div className="pd-header">
        {/* Hidden file input for avatar */}
        <input
          ref={avatarFileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => uploadAvatar(e.target.files[0])}
        />
        <div
          className="pd-avatar"
          onClick={() => !uploadingAvatar && avatarFileRef.current?.click()}
          title="Click to change profile picture"
        >
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.username} className="pd-avatar-img" />
            : <User size={48} color="#fff" />
          }
          <div className="pd-avatar-overlay">
            {uploadingAvatar ? '⏳' : <img src="/camera.png" alt="Change" className="pd-camera-icon" />}
          </div>
        </div>
        <div className="pd-header-info">
          <div className="pd-header-meta">
            <span className="pd-badge">ELITE MEMBER</span>
            <span className="pd-join-date">Joined {joinDate}</span>
          </div>
          <h1 className="pd-username">{user.username}</h1>
          <p className="pd-bio">
            Puzzle master and list conqueror. Points: <strong>{user.points || 0}</strong>
          </p>
        </div>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="pd-stats-row">
        {/* Puzzles Solved */}
        <div className="pd-stat-card">
          <div className="pd-stat-card-header">
            <img src={isDark ? '/puzzle_purple.png' : '/puzzle_gray.png'} alt="" className="pd-stat-icon" />
            <span className="pd-stat-label">LIFETIME</span>
          </div>
          <div className="pd-stat-value">
            {loadingStats ? '—' : (stats?.puzzlesSolved ?? 0).toLocaleString()}
          </div>
          <div className="pd-stat-sublabel">PUZZLES SOLVED</div>
        </div>

        {/* Retention */}
        <div className="pd-stat-card">
          <div className="pd-stat-card-header">
            <img src={isDark ? '/x_purple.png' : '/x_gray.png'} alt="" className="pd-stat-icon" />
            <span className="pd-stat-label">RETENTION</span>
          </div>
          <div className="pd-stat-value">
            {loadingStats ? '—' : `${retentionPct}%`}
          </div>
          <div className="pd-stat-sublabel">SUCCESS RATE</div>
        </div>

        {/* Peak Performance */}
        <div className="pd-stat-card pd-stat-card--accent">
          <div className="pd-stat-card-header">
            <img src="/medal_purple.png" alt="" className="pd-stat-icon pd-stat-icon--light" />
            <span className="pd-stat-label pd-stat-label--light">PEAK PERFORMANCE</span>
          </div>
          <div className="pd-stat-value pd-stat-value--light">
            {loadingStats ? '—' : (
              stats?.bestRank
                ? <>#{String(stats.bestRank).padStart(2, '0')} <span className="pd-rank-scope">Global</span></>
                : 'Unranked'
            )}
          </div>
          <div className="pd-stat-sublabel pd-stat-sublabel--light">BEST RANK</div>
          <img src="/medal_purple.png" alt="" className="pd-stat-bg-icon" />
        </div>
      </div>

      {/* ── Activity Overview ── */}
      <div className="pd-activity-card">
        <div className="pd-activity-header">
          <div>
            <h2 className="pd-activity-title">Activity Overview</h2>
            <p className="pd-activity-subtitle">
              Daily cognitive engagement over the last {activityRange === 'biweekly' ? '14' : '30'} days
            </p>
          </div>
          <div className="pd-range-toggle">
            <button
              className={`pd-range-btn ${activityRange === 'monthly' ? 'active' : ''}`}
              onClick={() => setActivityRange('monthly')}
            >
              MONTHLY
            </button>
            <button
              className={`pd-range-btn ${activityRange === 'biweekly' ? 'active' : ''}`}
              onClick={() => setActivityRange('biweekly')}
            >
              BI-WEEKLY
            </button>
          </div>
        </div>

        <div className="pd-chart-area">
          {stats?.activityDays ? (() => {
            const days = stats.activityDays;
            const n = days.length;
            const chartW = 800;
            const chartH = 200;
            const padX = 0;
            const padTop = 20;
            const padBot = 30;
            const drawH = chartH - padTop - padBot;

            // Normalised Y positions (0 = bottom, 1 = top)
            const points = days.map((d, i) => ({
              x: padX + (i / (n - 1)) * (chartW - padX * 2),
              y: padTop + drawH - (maxCount > 0 ? (d.count / maxCount) * drawH : 0),
              day: d.day,
              count: d.count,
              isToday: d.date === todayStr
            }));

            // Smooth Catmull-Rom → cubic Bezier path (clamped to prevent overshoot)
            const yMin = padTop;           // ceiling
            const yMax = padTop + drawH;   // baseline
            const clampY = (v) => Math.max(yMin, Math.min(yMax, v));

            const catmullRom = (pts) => {
              if (pts.length < 2) return `M ${pts[0]?.x || 0} ${pts[0]?.y || 0}`;
              let path = `M ${pts[0].x} ${pts[0].y}`;
              for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[Math.max(i - 1, 0)];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[Math.min(i + 2, pts.length - 1)];
                const tension = 0.3;
                const cp1x = p1.x + (p2.x - p0.x) * tension;
                const cp1y = clampY(p1.y + (p2.y - p0.y) * tension);
                const cp2x = p2.x - (p3.x - p1.x) * tension;
                const cp2y = clampY(p2.y - (p3.y - p1.y) * tension);
                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
              }
              return path;
            };

            const linePath = catmullRom(points);
            const areaPath = `${linePath} L ${points[n - 1].x} ${chartH - padBot} L ${points[0].x} ${chartH - padBot} Z`;

            return (
              <svg
                className="pd-wave-svg"
                viewBox={`0 0 ${chartW} ${chartH}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Filled area */}
                <path d={areaPath} fill="url(#waveGrad)" />
                {/* Stroke line */}
                <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {/* Data dots */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={p.isToday ? 5 : 3.5}
                    fill={p.count > 0 ? 'var(--primary)' : 'var(--border-color)'}
                    stroke={p.isToday ? '#fff' : 'none'}
                    strokeWidth={p.isToday ? 2 : 0}
                    className="pd-wave-dot"
                  >
                    <title>{`${p.day}: ${p.count} solved`}</title>
                  </circle>
                ))}
              </svg>
            );
          })() : (
            <div className="pd-chart-loading">Loading activity data...</div>
          )}
        </div>

        {/* Day labels below chart */}
        {stats?.activityDays && (
          <div className="pd-wave-labels">
            {stats.activityDays.map((d, i) => (
              <span
                key={d.date}
                className={`pd-wave-label ${d.date === todayStr ? 'pd-label-today' : ''}`}
              >
                {d.day}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer Info ── */}
      <div className="pd-footer">
        <span className="pd-server-status">
          Backend: <span style={{ color: serverMessage && serverMessage !== 'Backend not connected' ? '#10B981' : '#EF4444' }}>
            {serverMessage || 'Checking...'}
          </span>
        </span>
      </div>
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
  const [editingList, setEditingList] = useState(null);
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

  // Auto-fail all pending puzzles in incomplete lists before creating a new one
  const failIncompleteLists = async () => {
    const token = localStorage.getItem('token');
    const incompleteLists = lists.filter(l =>
      l.items && l.items.some(item => item.puzzle && item.puzzle.status === 'pending')
    );
    for (const list of incompleteLists) {
      for (const item of list.items) {
        if (item.puzzle && item.puzzle.status === 'pending' && item.puzzle._id) {
          try {
            await fetch(`http://localhost:5000/api/puzzle/${item.puzzle._id}/fail`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (err) {
            console.error('Error auto-failing puzzle:', err);
          }
        }
      }
    }
  };

  const handleListCreated = async () => {
    setShowBuilder(false);
    // Auto-fail any incomplete lists
    await failIncompleteLists();
    fetchLists(); // Refresh lists
    setActiveTab('Lists');
    setCooldown(60); // 60-second cooldown
  };

  // Edit list handlers
  const requestEditList = (e, list) => {
    e.stopPropagation();
    setEditingList(list);
  };

  const handleEditSaved = (updatedList) => {
    setEditingList(null);
    // Update the list in place
    setLists(prev => prev.map(l => l._id === updatedList._id ? updatedList : l));
    // Reset cooldown since editing resets the timer
    setCooldown(30);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <header className="app-header">
        <div className="logo-container">
          <img src={theme === 'dark' ? '/small_logo_white.png' : '/small_logo.png'} alt="Forgetti-List" className="sidebar-logo-small" />
          <img src={theme === 'dark' ? '/logo_white.png' : '/logo.png'} alt="Forgetti-List" className="sidebar-logo-full" />
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
            requestEditList={requestEditList}
            setShowBuilder={setShowBuilder}
            theme={theme}
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
          <ProfileDashboard
            user={user}
            onUpdateUser={onUpdateUser}
            onLogout={onLogout}
            serverMessage={serverMessage}
            uploadingAvatar={uploadingAvatar}
            avatarFileRef={avatarFileRef}
            uploadAvatar={uploadAvatar}
            theme={theme}
          />
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

      {/* Edit List Modal */}
      {editingList && (
        <EditListModal
          list={editingList}
          onClose={() => setEditingList(null)}
          onSaved={handleEditSaved}
        />
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
