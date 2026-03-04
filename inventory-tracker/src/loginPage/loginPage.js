import logo from '../images/inventory_logo.png';
import './loginPage.css';

function App() {
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="header">
          <img src={logo} className="login-logo" alt="logo" />
          <p>Please enter your details to sign in.</p>
        </div>
        
        <form className="login-form">
          <div className="input-group">
            <label>Username</label>
            <input type="text" placeholder="Username" required />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Password" required />
          </div>

          <button type="submit" className="login-button">Sign In</button>
        </form>

        <div className="login-footer">
          <a href="/forgot-password">Forgot password?</a>
        </div>
        
      </div>
    </div>
  );
}

export default App;
