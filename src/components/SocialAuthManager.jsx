import React, { useState, useEffect } from 'react';
import { getCurrentUser, getAuthHeaders } from '../../lib/auth';

const SocialAuthManager = () => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get current user on component mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // Fetch current tokens
  const fetchTokens = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/social/tokens/${user.id}`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens.reduce((acc, token) => {
          acc[token.platform] = token;
          return acc;
        }, {}));
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate tokens
  const validateTokens = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/social/validate/${user.id}`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage('Token validation completed. Check console for details.');
        console.log('Token validation:', data);
      }
    } catch (error) {
      console.error('Error validating tokens:', error);
    }
  };

  // Store Facebook token
  const storeFacebookToken = async () => {
    const accessToken = prompt('Enter your Facebook access token:');
    if (!accessToken) return;

    const expiresAt = prompt('Enter expiration date (YYYY-MM-DD HH:MM:SS) or press Enter for 24 hours from now:');
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    setLoading(true);
    try {
      const response = await fetch('/api/social/tokens', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'facebook',
          accessToken,
          expiresAt: expirationDate.toISOString(),
          userId: user.id
        })
      });

      if (response.ok) {
        setMessage('Facebook token stored successfully!');
        fetchTokens();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Store Reddit token
  const storeRedditToken = async () => {
    const accessToken = prompt('Enter your Reddit access token:');
    if (!accessToken) return;

    const refreshToken = prompt('Enter refresh token (optional):');
    const expiresAt = prompt('Enter expiration date (YYYY-MM-DD HH:MM:SS) or press Enter for 24 hours from now:');
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    setLoading(true);
    try {
      const response = await fetch('/api/social/tokens', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'reddit',
          accessToken,
          refreshToken: refreshToken || null,
          expiresAt: expirationDate.toISOString(),
          userId: user.id
        })
      });

      if (response.ok) {
        setMessage('Reddit token stored successfully!');
        fetchTokens();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [user]);

  const getTokenStatus = (platform) => {
    const token = tokens[platform];
    if (!token) return { status: 'Not configured', color: 'text-gray-500' };
    
    const isExpired = new Date(token.expiresAt) < new Date();
    if (isExpired) return { status: 'Expired', color: 'text-red-500' };
    
    return { status: 'Active', color: 'text-green-500' };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Social Media Authentication</h2>
      
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Facebook Token */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                f
              </span>
              Facebook
            </h3>
            <span className={`text-sm font-medium ${getTokenStatus('facebook').color}`}>
              {getTokenStatus('facebook').status}
            </span>
          </div>
          
          {tokens.facebook && (
            <div className="mb-4 text-sm text-gray-600">
              <p>Expires: {new Date(tokens.facebook.expiresAt).toLocaleString()}</p>
              <p>Created: {new Date(tokens.facebook.createdAt).toLocaleString()}</p>
            </div>
          )}
          
          <button
            onClick={storeFacebookToken}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Configure Facebook Token'}
          </button>
        </div>

        {/* Reddit Token */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                R
              </span>
              Reddit
            </h3>
            <span className={`text-sm font-medium ${getTokenStatus('reddit').color}`}>
              {getTokenStatus('reddit').status}
            </span>
          </div>
          
          {tokens.reddit && (
            <div className="mb-4 text-sm text-gray-600">
              <p>Expires: {new Date(tokens.reddit.expiresAt).toLocaleString()}</p>
              <p>Created: {new Date(tokens.reddit.createdAt).toLocaleString()}</p>
            </div>
          )}
          
          <button
            onClick={storeRedditToken}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Configure Reddit Token'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={fetchTokens}
          disabled={loading}
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Refresh Status
        </button>
        
        <button
          onClick={validateTokens}
          disabled={loading}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Validate Tokens
        </button>
      </div>

      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">How to Get Tokens:</h4>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>Facebook:</strong> Use Facebook Graph API Explorer or your app's access tokens</p>
          <p><strong>Reddit:</strong> Use Reddit API to get OAuth tokens for your app</p>
          <p><strong>Security:</strong> Tokens are encrypted and stored securely. Never share them publicly.</p>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthManager;
