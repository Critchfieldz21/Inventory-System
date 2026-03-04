import React, { useState } from 'react'; // 1. Import useState
import { useNavigate } from 'react-router-dom';
import logo from '../images/inventory_logo.png';
import './loginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  
  // 2. Create state for the inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); // Prevents page refresh

    // 3. Add your "Correct" credentials check
    if (username === "admin" && password === "123") {
      navigate('/home'); // Redirects on success
    } else {
      alert("Invalid username or password!"); // Error feedback
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="header">
          <img src={logo} className="login-logo" alt="logo" />
          <p>Please enter your details to sign in.</p>
        </div>
        
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)} // Update state
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update state
            />
          </div>

          <button type="submit" className="login-button">Sign In</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
