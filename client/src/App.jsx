import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    // Fetch data from the backend to verify connection
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setServerMessage(data))
      .catch(err => {
        console.error('Error connecting to backend:', err);
        setServerMessage('Backend not connected');
      });
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <h1>MERN Stack Starter</h1>
        <p>Build something amazing with MongoDB, Express, React, and Node.js</p>
      </header>

      <main className="main-content">
        <section className="card backend-status">
          <h2>Backend Status</h2>
          <div className="status-indicator">
            <span className={`status-dot ${serverMessage && serverMessage !== 'Backend not connected' ? 'online' : 'offline'}`}></span>
            <p>{serverMessage ? serverMessage : 'Connecting to server...'}</p>
          </div>
        </section>

        <section className="features-grid">
          <div className="card feature">
            <h3>🚀 Fast & Modern</h3>
            <p>Powered by Vite for lightning-fast development and HMR.</p>
          </div>
          <div className="card feature">
            <h3>🎨 Stylized</h3>
            <p>Clean, modern UI designed to impress out of the box.</p>
          </div>
          <div className="card feature">
            <h3>🔌 API Ready</h3>
            <p>Pre-configured Express server with CORS and Mongoose setup.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Created by Antigravity using React + Express</p>
      </footer>
    </div>
  );
}

export default App;
