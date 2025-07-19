import React from 'react';
import { useAuth } from '../context/auth-context';

export function LogoutButton() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="user-info">
      <div className="user-profile">
        <img 
          src={user.avatar} 
          alt={user.personaname}
          className="user-avatar"
        />
        <span className="user-name">{user.personaname}</span>
      </div>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  );
}