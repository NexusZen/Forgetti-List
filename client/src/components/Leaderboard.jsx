import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';

const Leaderboard = () => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/leaderboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setRankings(data.data);
                }
            } catch (err) {
                console.error("Failed to load leaderboard", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown size={24} color="#FBBF24" fill="#FBBF24" />;
        if (index === 1) return <Medal size={24} color="#9CA3AF" />;
        if (index === 2) return <Medal size={24} color="#B45309" />; // Bronze-ish
        return <span className="rank-number">{index + 1}</span>;
    };

    if (loading) return <div className="loading-spinner">Loading rankings...</div>;

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header-section">
                <img src="/leaderboard.png" alt="Leaderboard" style={{ width: '60px', height: 'auto', display: 'block', margin: '0 auto 1rem' }} />
                <h2>Leaderboard</h2>
                <p>Top players by points earned from completed lists.</p>
            </div>

            <div className="lists-box">
                <div className="rankings-list" style={{ boxShadow: 'none', borderRadius: '16px' }}>
                    <div className="ranking-header">
                        <span>Rank</span>
                        <span>User</span>
                        <span>Points</span>
                    </div>
                    {rankings.map((entry, index) => (
                        <div
                            key={entry._id}
                            className={`ranking-item ${entry.user === currentUser?.id || entry.username === currentUser?.username ? 'current-user-rank' : ''}`}
                        >
                            <div className="rank-position">
                                {getRankIcon(index)}
                            </div>
                            <div className="rank-user">
                                <span className="rank-username">{entry.username}</span>
                            </div>
                            <div className="rank-points">
                                {entry.totalPoints} pts
                            </div>
                        </div>
                    ))}

                    {rankings.length === 0 && (
                        <div className="empty-leaderboard">No records yet. Be the first!</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
