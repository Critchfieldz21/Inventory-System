import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/inventory_logo.png';
import './loginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === "admin" && password === "123") {
      navigate('/home');
    } else {
      alert("Invalid username or password!");
    }
  };

  const handleForgotLogin = (e) => {
    e.preventDefault(); // Prevents form submission
    // Show pop-up with default credentials
    alert("\nUsername: admin\nPassword: 123");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="header">
          <img src={logo} className="login-logo" alt="logo" />
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Username" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <button type="submit" className="login-button">Sign In</button>

          {/* Forgot Login Link placed under the button */}
          <div className="forgot-login-container" style={{ textAlign: 'center', marginTop: '15px' }}>
            <a 
              href="/forgot-password" 
              onClick={handleForgotLogin}
              style={{ fontSize: '0.85rem', color: '#007bff', textDecoration: 'none' }}
            >
              Forgot Login?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
