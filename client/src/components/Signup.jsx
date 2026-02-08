import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
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
            <div className="auth-box">
                <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                    <img src="/logo.png" alt="Forgetti-List Logo" style={{ maxWidth: '200px', height: 'auto' }} />
                </div>
                <p className="text-gray mb-4">Create your account</p>

                {error && <div className="alert error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={username}
                        onChange={handleChange}
                        required
                        minLength="3"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={handleChange}
                        required
                        minLength="6"
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleChange}
                        required
                        minLength="6"
                    />
                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-4 text-gray">
                    Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#7C3AED', cursor: 'pointer', fontWeight: 'bold' }}>Sign In</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
