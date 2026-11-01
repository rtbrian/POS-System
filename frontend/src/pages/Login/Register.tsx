// frontend/src/pages/Auth/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authservice'; // Note the path change (../../)
import { getErrorMessage } from '../../services/api';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const { session } = await registerUser(email, password);
      if (session) {
        navigate('/dashboard');
      } else {
        setNotice('Check your email to confirm your account, then sign in.');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-96 p-6 shadow-lg bg-white rounded-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        <p className="mb-4 text-center text-xs text-gray-500">
          New accounts need a business assignment from an administrator before they can access inventory.
        </p>
        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
        {notice && <p className="text-green-700 text-sm mb-3 text-center">{notice}</p>}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input type="email" className="w-full p-2 border border-gray-300 rounded mt-1"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input type="password" className="w-full p-2 border border-gray-300 rounded mt-1"
              value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition">
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;