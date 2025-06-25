import React, { useState } from 'react';
import { signUp } from '@/services/authService';
import { createProfile } from '@/services/profileService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const { data, error } = await signUp(email, password);
    if (!error && data?.user) {
      // Create profile in your own table
      await createProfile(data.user.id, email);
    }
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <>
      <form onSubmit={handleRegister} className="max-w-sm mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Register</h2>
        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="mb-3" />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="mb-3" />
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Registering...' : 'Register'}</Button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">Registration successful! Check your email to confirm.</div>}
      </form>
    </>
  );
};

export default Register;
