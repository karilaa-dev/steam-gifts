import React from 'react';
import { useAuth } from '../context/auth-context';

export function LoginButton() {
  const { login, isLoading } = useAuth();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🎮 Steam Authentication Required</h2>
        <p>To view your friends' wishlists, please sign in with your Steam account.</p>
        
        <button 
          onClick={login}
          disabled={isLoading}
          className="steam-login-button"
        >
          <img 
            src="https://community.cloudflare.steamstatic.com/public/images/signinthroughsteam/sits_01.png" 
            alt="Sign in through Steam"
          />
        </button>
        
        <div className="login-info">
          <p>✅ We only access your public Steam profile information</p>
          <p>✅ Your Steam login credentials are never shared with us</p>
          <p>✅ You can revoke access at any time from your Steam account</p>
        </div>
      </div>
    </div>
  );
}