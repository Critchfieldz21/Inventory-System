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
      alert("Invalid username or password!\n\n Hint: check click forgot login!");
    }
  };

  const handleForgotLogin = (e) => {
    e.preventDefault(); // Prevents form submission
    // Show pop-up with default credentials
    alert("Don't forget next time!\n\nUsername: admin\nPassword: 123");
  };

  return (
    <div className="login-container">

      {/* --- Left branding panel --- */}
      <div className="login-brand">
        <img src={logo} className="login-logo" alt="logo" />
        <h1>Inventory Tracker</h1>
        <p>Manage your stock, sales, and recipes all in one place.</p>
      </div>

      {/* --- Right form panel --- */}
      <div className="login-form-panel">
        <div className="login-box">
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to your account to continue.</p>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-button">Sign In</button>

            <div className="forgot-login-container">
              <a href="/forgot-password" onClick={handleForgotLogin}>
                Forgot your login?
              </a>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;
