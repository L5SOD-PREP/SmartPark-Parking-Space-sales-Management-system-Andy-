import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../api/config.js';
import { useToast } from '../components/Toast.jsx';
import { FiArrowLeft, FiMail, FiHelpCircle, FiLock } from 'react-icons/fi';

function ForgotPassword() {
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState(['', '']);
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestQuestions = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${API}/forgot-password`, { Email: email });
            setQuestions(data.questions);
            setStep(2);
            toast('Answer your security questions', 'info');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to find account', 'error');
        } finally { setLoading(false); }
    };

    const handleVerifyAnswers = async (e) => {
        e.preventDefault();
        if (!answers[0].trim() || !answers[1].trim()) {
            toast('Please answer both questions', 'error');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API}/verify-answers`, { Email, Answers: answers });
            toast('Answers verified', 'success');
            setStep(3);
        } catch (err) {
            toast(err.response?.data?.message || 'Incorrect answers', 'error');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            toast('Password must have 8+ chars, uppercase, lowercase, number, and special character', 'error');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API}/reset-password`, { Email, NewPassword: newPassword });
            toast('Password reset successfully! Please login.', 'success');
            navigate('/login');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to reset password', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative">
            <button onClick={() => navigate('/login')} className="absolute top-6 left-6 text-gray-400 hover:text-gray-900 flex items-center gap-2 transition">
                <FiArrowLeft size={20} /> Back to Login
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-400 w-full max-w-lg">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-black">PSSMS</h1>
                    <p className="text-gray-400">Recover your password</p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleRequestQuestions} className="space-y-4">
                        <p className="text-sm text-gray-400 text-center">Enter your email to retrieve your security questions.</p>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50">
                            {loading ? 'Checking...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyAnswers} className="space-y-4">
                        <p className="text-sm text-gray-400 text-center">Answer your security questions.</p>
                        {questions.map((q, i) => (
                            <div key={q.Q_ID}>
                                <label className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-1">
                                    <FiHelpCircle size={14} className="text-gray-400" /> {q.QuestionText}
                                </label>
                                <input placeholder="Your answer" value={answers[i]} onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }} className="w-full border border-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                            </div>
                        ))}
                        <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Verify Answers'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <p className="text-sm text-gray-400 text-center">Answers verified. Choose a new password.</p>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50">
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
