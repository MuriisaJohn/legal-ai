import React, { useState } from 'react';
import { signIn } from 'src/services/authService';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import UserMenu from './UserMenu';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await signIn(email, password);
      console.log('Supabase login result:', result);
      
      // Check for errors first
      if (result?.error) {
        if (result.error.message.includes('Email not confirmed')) {
          setError('Please confirm your email before logging in.');
        } else if (result.error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(result.error.message);
        }
        setSuccess(false);
      } 
      // Check for successful authentication with valid session
      else if (result?.data?.user && result?.data?.session) {
        setSuccess(true);
        setError(null);
      } 
      // Handle case where user exists but no session (shouldn't happen in normal flow)
      else if (result?.data?.user && !result?.data?.session) {
        setError('Authentication failed. Please try again.');
        setSuccess(false);
      }
      // Handle unexpected cases
      else {
        setError('Login failed. Please check your credentials.');
        setSuccess(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="max-w-sm mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <Input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          className="mb-3" 
        />
        <Input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          className="mb-3" 
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">Login successful!</div>}
      </form>
      {success && (
        <div className="mt-4 flex justify-center">
          <UserMenu />
        </div>
      )}
    </>
  );
};

export default Login;