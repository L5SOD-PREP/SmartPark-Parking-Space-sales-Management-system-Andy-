import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { GridSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FiSearch, FiPlus, FiGrid } from 'react-icons/fi';

function ParkingSlot() {
    const toast = useToast();
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState({ SlotNumber: '', SlotStatus: 'available' });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchSlots = async () => {
        try { setSlots((await api.get('/slots')).data); }
        catch { toast('Failed to load slots', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSlots(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/slots', form);
            toast('Slot added successfully', 'success');
            setForm({ SlotNumber: '', SlotStatus: 'available' });
            fetchSlots();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to add slot', 'error');
        }
    };

    const statusColors = {
        available: { bg: '#ECFDF5', text: '#22C55E', border: '#22C55E' },
        occupied: { bg: '#FEF2F2', text: '#EF4444', border: '#EF4444' },
        reserved: { bg: '#FFFBEB', text: '#F59E0B', border: '#F59E0B' },
        disabled: { bg: '#F3F4F6', text: '#6B7280', border: '#6B7280' },
    };

    const statusBadge = (status) => {
        const c = statusColors[status] || statusColors.disabled;
        return <span className="px-3 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>{status}</span>;
    };

    const filtered = slots.filter((s) => {
        const matchSearch = s.SlotNumber.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.SlotStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusCounts = {
        all: slots.length,
        available: slots.filter(s => s.SlotStatus === 'available').length,
        occupied: slots.filter(s => s.SlotStatus === 'occupied').length,
        reserved: slots.filter(s => s.SlotStatus === 'reserved').length,
        disabled: slots.filter(s => s.SlotStatus === 'disabled').length,
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Parking Slot Management</h1>
                <p className="text-gray-400 text-sm mt-1">Add and monitor parking space availability</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(statusCounts).map(([key, count]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${statusFilter === key ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                    >
                        {key} ({count})
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Slot</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FiGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="SlotNumber" placeholder="Slot Number (e.g. A1)" value={form.SlotNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none transition" required />
                    </div>
                    <select name="SlotStatus" value={form.SlotStatus} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition">
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="disabled">Disabled</option>
                    </select>
                    <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 justify-center">
                        <FiPlus size={18} /> Add Slot
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">All Parking Slots</h2>
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input placeholder="Search slot number..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none transition" />
                    </div>
                </div>
                {loading ? (
                    <GridSkeleton />
                ) : filtered.length === 0 ? (
                    <EmptyState title="No slots found" description={search || statusFilter !== 'all' ? 'Try different search or filter.' : 'Add your first parking slot above.'} icon={FiGrid} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filtered.map((slot, i) => (
                            <div key={slot.SlotNumber} className="card-enter border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white" style={{ animationDelay: `${i * 0.05}s` }}>
                                <p className="text-lg font-bold text-gray-900">{slot.SlotNumber}</p>
                                <div className="mt-2">{statusBadge(slot.SlotStatus)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ParkingSlot;
