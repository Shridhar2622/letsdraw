import React, { useState, useContext } from 'react';
import { X, User, Lock, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AuthModal({ show, set }) {
    const { login } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            login(data.user, data.token);
            set(false); // Close modal
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#FDF5E6]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border-4 border-purple-800 p-6 md:p-8 w-full max-w-sm shadow-[8px_10px_0px_#D8B4FE] relative font-patrick">
                
                {/* Close Button */}
                <button 
                    onClick={() => set(false)}
                    className="absolute -top-4 -right-4 bg-red-400 border-4 border-red-700 rounded-full p-2 text-white hover:bg-red-500 hover:-translate-y-1 transition-all shadow-[2px_4px_0px_#B91C1C]"
                >
                    <X size={24} strokeWidth={3} />
                </button>

                <h2 className="text-3xl font-bold text-purple-900 text-center mb-6">
                    {isLogin ? 'Welcome Back!' : 'Create Account'}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                        <input
                            type="text"
                            required
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-purple-50 border-4 border-purple-200 rounded-xl py-3 pl-10 pr-4 text-purple-900 font-bold placeholder:text-purple-300 outline-none focus:border-purple-400 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                        <input
                            type="password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-purple-50 border-4 border-purple-200 rounded-xl py-3 pl-10 pr-4 text-purple-900 font-bold placeholder:text-purple-300 outline-none focus:border-purple-400 focus:bg-white transition-all"
                        />
                    </div>

                    {error && <p className="text-red-500 font-bold text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-yellow-400 border-4 border-yellow-600 rounded-xl py-3 font-bold text-xl text-yellow-900 shadow-[4px_4px_0px_#CA8A04] hover:-translate-y-1 hover:shadow-[4px_6px_0px_#CA8A04] active:translate-y-1 active:shadow-[0px_0px_0px_#CA8A04] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <p className="text-center text-purple-400 font-bold mt-6">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-purple-600 hover:text-purple-800 underline decoration-2 underline-offset-2"
                    >
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}
