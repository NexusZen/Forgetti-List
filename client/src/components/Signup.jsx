import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../App.css';

const Signup = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const { username, email, password, confirmPassword } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
                if (onLogin) onLogin(data.data);
                navigate('/');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Video Background */}
            <video
                className="auth-video-bg"
                autoPlay
                muted
                loop
                playsInline
            >
                <source src="/intro.mp4" type="video/mp4" />
            </video>
            <div className="auth-video-overlay" />

            {/* Glass Card */}
            <div className="auth-glass-card">
                {/* Large logo with shrink animation */}
                <div className="auth-logo-wrap">
                    <img src="/logo_white.png" alt="Forgetti-List" className="auth-logo-img" />
                </div>

                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join and start solving puzzles today</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-input-group">
                        <label className="auth-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            className="auth-input"
                            placeholder="Choose a username"
                            value={username}
                            onChange={handleChange}
                            required
                            minLength="3"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <div className="auth-password-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={handleChange}
                                required
                                minLength="6"
                            />
                            <button
                                type="button"
                                className="auth-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="auth-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={handleChange}
                            required
                            minLength="6"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                    >
                        {loading ? (
                            <span className="auth-spinner" />
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <span onClick={() => navigate('/login')}>Sign In</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
