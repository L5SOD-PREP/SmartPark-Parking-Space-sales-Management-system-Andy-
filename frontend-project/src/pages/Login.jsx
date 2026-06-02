import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { FiArrowLeft } from 'react-icons/fi';

const questions = [
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is your favorite book?',
    'What is the name of your best childhood friend?',
    'What was the model of your first car?',
    'What is the name of your favorite teacher?',
    'What is your favorite movie?',
    'What is the name of the street you grew up on?',
    'What is your favorite food?',
];

const strengthChecks = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pwd) {
    const passed = strengthChecks.filter((c) => c.test(pwd)).length;
    if (passed === 0) return { label: '', color: 'bg-gray-200', width: '0%' };
    if (passed <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (passed <= 4) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
}

function Login() {
    const navigate = useNavigate();
    const toast = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ Name: '', Email: '', Password: '', Role: 'staff', SecurityQ1: '', SecurityQ2: '', Answer1: '', Answer2: '' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isLogin) {
            const failed = strengthChecks.filter((c) => !c.test(form.Password));
            if (failed.length > 0) {
                toast('Password must have: ' + failed.map((c) => c.label.toLowerCase()).join(', '), 'error');
                return;
            }
            if (!form.SecurityQ1 || !form.SecurityQ2 || !form.Answer1 || !form.Answer2) {
                toast('Please select and answer two security questions', 'error');
                return;
            }
            if (form.SecurityQ1 === form.SecurityQ2) {
                toast('Please select two different questions', 'error');
                return;
            }
        }
        try {
            const endpoint = isLogin ? '/login' : '/register';
            const { data } = await api.post(endpoint, form);
            if (isLogin) {
                toast('Login successful! Welcome back.', 'success');
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setTimeout(() => window.location.href = '/dashboard', 500);
            } else {
                toast('Registration successful! Please login.', 'success');
                setIsLogin(true);
            }
        } catch (err) {
            toast(err.response?.data?.message || (err.response?.data?.details || []).join(', ') || 'Operation failed', 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative">
            <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-gray-400 hover:text-gray-900 flex items-center gap-2 transition">
                <FiArrowLeft size={20} /> Back to Home
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-400 w-full max-w-lg">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-black">PSSMS</h1>
                    <p className="text-gray-400">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
                </div>

                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                    <button className={`flex-1 py-2 rounded-md text-sm font-medium transition ${isLogin ? 'bg-black text-white' : 'text-gray-600'}`} onClick={() => setIsLogin(true)}>Login</button>
                    <button className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!isLogin ? 'bg-black text-white' : 'text-gray-600'}`} onClick={() => setIsLogin(false)}>Register</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input name="Name" placeholder="Full Name" value={form.Name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                    )}
                    <input name="Email" type="email" placeholder="Email" value={form.Email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                    <input name="Password" type="password" placeholder="Password" value={form.Password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                    {isLogin && (
                        <div className="text-right -mt-2">
                            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-gray-400 hover:text-gray-900 transition">Forgot Password?</button>
                        </div>
                    )}
                    {!isLogin && (
                        <>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full transition-all ${getStrength(form.Password).color}`} style={{ width: getStrength(form.Password).width }} />
                            </div>
                            <p className="text-xs text-gray-500 text-right">{getStrength(form.Password).label}</p>
                            <ul className="text-xs space-y-1">
                                {strengthChecks.map((c) => (
                                    <li key={c.label} className={`flex items-center gap-1 ${c.test(form.Password) ? 'text-green-600' : 'text-gray-400'}`}>
                                        {c.test(form.Password) ? '\u2713' : '\u2022'} {c.label}
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm font-semibold text-gray-900 mb-3">Security Questions (for password recovery)</p>
                                <div className="space-y-3">
                                    <div>
                                        <select name="SecurityQ1" value={form.SecurityQ1} onChange={handleChange} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required>
                                            <option value="">Select question 1</option>
                                            {questions.map((q) => (
                                                <option key={q} value={q} disabled={q === form.SecurityQ2}>{q}</option>
                                            ))}
                                        </select>
                                        <input name="Answer1" placeholder="Your answer" value={form.Answer1} onChange={handleChange} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                                    </div>
                                    <div>
                                        <select name="SecurityQ2" value={form.SecurityQ2} onChange={handleChange} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required>
                                            <option value="">Select question 2</option>
                                            {questions.map((q) => (
                                                <option key={q} value={q} disabled={q === form.SecurityQ1}>{q}</option>
                                            ))}
                                        </select>
                                        <input name="Answer2" placeholder="Your answer" value={form.Answer2} onChange={handleChange} className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {!isLogin && (
                        <select name="Role" value={form.Role} onChange={handleChange} className="w-full px-4 py-2 border border-gray-400 rounded-lg">
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    )}
                    <button type="submit" className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
