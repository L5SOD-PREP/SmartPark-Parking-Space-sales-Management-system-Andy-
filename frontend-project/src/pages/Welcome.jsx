import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiGrid, FiFileText, FiDollarSign, FiBarChart2, FiClock, FiCheckCircle } from 'react-icons/fi';
import api from '../api/api.js';
import { CardSkeleton } from '../components/Skeleton.jsx';

function AnimatedNumber({ value, suffix = '' }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(value) || 0;
        if (end === 0) { setDisplay('0'); return; }
        const duration = 600;
        const step = Math.ceil(end / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setDisplay(end); clearInterval(timer); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <>{display}{suffix}</>;
}

const cards = [
    { path: '/cars', label: 'Manage Cars', desc: 'Register and view vehicles', icon: FiTruck },
    { path: '/slots', label: 'Parking Slots', desc: 'Manage parking spaces', icon: FiGrid },
    { path: '/records', label: 'Parking Records', desc: 'Track parking sessions', icon: FiFileText },
    { path: '/payments', label: 'Payments', desc: 'Process and view payments', icon: FiDollarSign },
    { path: '/reports', label: 'Reports', desc: 'Generate and export reports', icon: FiBarChart2 },
];

function Welcome() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [recRes, slotRes, payRes] = await Promise.all([
                    api.get('/records'),
                    api.get('/slots'),
                    api.get('/payments'),
                ]);
                const records = recRes.data;
                const today = new Date().toDateString();
                setStats({
                    slots: slotRes.data.length,
                    available: slotRes.data.filter((s) => s.SlotStatus === 'available').length,
                    active: records.filter((r) => !r.ExitTime).length,
                    revenue: payRes.data
                        .filter((p) => new Date(p.PaymentDate).toDateString() === today)
                        .reduce((s, p) => s + Number(p.AmountPaid), 0),
                });
            } catch {}
        };
        fetchStats();
    }, []);

    const statItems = [
        { label: 'Total Slots', value: stats?.slots ?? 0, icon: FiGrid, color: 'bg-gray-800' },
        { label: 'Available', value: stats?.available ?? 0, icon: FiCheckCircle, color: 'bg-gray-800' },
        { label: 'Active Sessions', value: stats?.active ?? 0, icon: FiClock, color: 'bg-gray-800' },
        { label: "Today's Revenue", value: stats?.revenue ?? 0, icon: FiDollarSign, color: 'bg-gray-800' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, <span className="">{user.name || 'User'}</span>!
                </h1>
                <p className="text-gray-400 mt-1">Here's what's happening at your parking facility today.</p>
            </div>

            {!stats ? (
                <CardSkeleton />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statItems.map((item, i) => (
                        <div
                            key={item.label}
                            className="card-enter bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <div className={`w-11 h-11 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
                                <item.icon className="text-white" size={22} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                <AnimatedNumber value={item.value} suffix={item.label === "Today's Revenue" ? ' RWF' : ''} />
                            </p>
                            <p className="text-gray-400 text-sm mt-1">{item.label}</p>
                        </div>
                    ))}
                </div>
            )}

            <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((card, i) => (
                    <button
                        key={card.path}
                        onClick={() => navigate(card.path)}
                        className="card-enter group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
                        style={{ animationDelay: `${i * 0.08}s` }}
                    >
                        <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <card.icon className="text-white" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:transition-colors">{card.label}</h3>
                        <p className="text-gray-400 text-sm mt-1">{card.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Welcome;
