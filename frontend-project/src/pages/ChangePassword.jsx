import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { FiLock, FiArrowLeft, FiCheck } from 'react-icons/fi';

const strengthChecks = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pwd) {
    const passed = strengthChecks.filter((c) => c.test(pwd)).length;
    if (passed <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (passed <= 4) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
}

function ChangePassword() {
    const navigate = useNavigate();
    const toast = useToast();
    const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            toast('Passwords do not match', 'error');
            return;
        }
        const failed = strengthChecks.filter((c) => !c.test(form.newPassword));
        if (failed.length > 0) {
            toast('Password must have: ' + failed.map((c) => c.label.toLowerCase()).join(', '), 'error');
            return;
        }
        setLoading(true);
        try {
            await api.put('/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword });
            toast('Password changed successfully', 'success');
            setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            navigate('/dashboard');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-lg mx-auto mt-8">
            <div className="mb-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 transition mb-4">
                    <FiArrowLeft size={18} /> Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                <p className="text-gray-400 text-sm mt-1">Update your account password</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="oldPassword" type="password" placeholder="Current Password" value={form.oldPassword} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition" required />
                    </div>
                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="newPassword" type="password" placeholder="New Password" value={form.newPassword} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition" required />
                    </div>
                    <div className="relative">
                        <FiCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="confirmPassword" type="password" placeholder="Confirm New Password" value={form.confirmPassword} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition" required />
                    </div>

                    {form.newPassword && (
                        <div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full transition-all ${getStrength(form.newPassword).color}`} style={{ width: getStrength(form.newPassword).width }} />
                            </div>
                            <p className="text-xs text-gray-500 text-right mt-1">{getStrength(form.newPassword).label}</p>
                            <ul className="text-xs space-y-1 mt-2">
                                {strengthChecks.map((c) => (
                                    <li key={c.label} className={`flex items-center gap-1 ${c.test(form.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                                        {c.test(form.newPassword) ? '\u2713' : '\u2022'} {c.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50">
                        {loading ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;
