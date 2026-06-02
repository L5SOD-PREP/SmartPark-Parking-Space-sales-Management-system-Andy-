import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FiSearch, FiFileText, FiDollarSign } from 'react-icons/fi';

function fmtDuration(min) {
    if (!min && min !== 0) return '-';
    const abs = Math.abs(min);
    const h = Math.floor(abs / 60);
    const m = Math.round(abs % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
}

const calcFee = (entryTime) => {
    if (!entryTime) return 500;
    const diffMin = (new Date() - new Date(entryTime)) / 60000;
    return Math.ceil(Math.max(0, diffMin) / 60) * 500;
};

function ParkingRecord() {
    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [cars, setCars] = useState([]);
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState({ SlotNumber: '', plateNumber: '', User_ID: '', EntryTime: '' });
    const [editForm, setEditForm] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [checkoutModal, setCheckoutModal] = useState({ open: false, record: null, amount: '' });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = async () => {
        try {
            const [recRes, carRes, slotRes] = await Promise.all([
                api.get('/records'),
                api.get('/cars'),
                api.get('/slots'),
            ]);
            setRecords(recRes.data);
            setCars(carRes.data);
            setSlots(slotRes.data);
        } catch { toast('Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, User_ID: user.id };
            await api.post('/records', payload);
            toast('Parking session started', 'success');
            setForm({ SlotNumber: '', plateNumber: '', User_ID: '', EntryTime: '' });
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to create record', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this parking record?')) return;
        try { await api.delete(`/records/${id}`); toast('Record deleted', 'success'); fetchData(); }
        catch { toast('Failed to delete', 'error'); }
    };

    const openCheckout = (rec) => {
        setCheckoutModal({ open: true, record: rec, amount: calcFee(rec.EntryTime).toString() });
    };

    const handleCheckoutPay = async (e) => {
        e.preventDefault();
        const { record, amount } = checkoutModal;
        if (!amount || Number(amount) <= 0) {
            toast('Enter a valid amount', 'error');
            return;
        }
        try {
            await api.post('/payments', { plateNumber: record.plateNumber, SlotNumber: record.SlotNumber, AmountPaid: amount });
            toast('Payment recorded & vehicle checked out', 'success');
            setCheckoutModal({ open: false, record: null, amount: '' });
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to process payment', 'error');
        }
    };

    const openEdit = (rec) => {
        setEditForm({ P_ID: rec.P_ID, SlotNumber: rec.SlotNumber, plateNumber: rec.plateNumber, User_ID: rec.User_ID, EntryTime: rec.EntryTime ? rec.EntryTime.slice(0, 16) : '', ExitTime: rec.ExitTime ? rec.ExitTime.slice(0, 16) : '' });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/records/${editForm.P_ID}`, editForm);
            setEditForm(null);
            toast('Record updated', 'success');
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update', 'error');
        }
    };

    const statusBadge = (exitTime) => {
        return exitTime
            ? <span className="px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: '#ECFDF5', color: '#22C55E', borderColor: '#22C55E' }}>Completed</span>
            : <span className="px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B', borderColor: '#F59E0B' }}>Active</span>;
    };

    const filtered = records.filter((r) => {
        const matchSearch = r.SlotNumber?.toLowerCase().includes(search.toLowerCase()) ||
            r.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
            (r.DriverName || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && !r.ExitTime) ||
            (statusFilter === 'completed' && r.ExitTime);
        const entry = r.EntryTime ? new Date(r.EntryTime) : null;
        const fromOk = !dateFrom || (entry && entry >= new Date(dateFrom));
        const toOk = !dateTo || (entry && entry <= new Date(dateTo + 'T23:59:59'));
        return matchSearch && matchStatus && fromOk && toOk;
    });

    const activeCount = records.filter(r => !r.ExitTime).length;
    const completedCount = records.filter(r => r.ExitTime).length;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Parking Records</h1>
                <p className="text-gray-400 text-sm mt-1">Track and manage parking sessions</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">New Parking Session</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select name="SlotNumber" value={form.SlotNumber} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" required>
                        <option value="">Select Slot</option>
                        {slots.filter(s => s.SlotStatus === 'available').map(s => (
                            <option key={s.SlotNumber} value={s.SlotNumber}>{s.SlotNumber} ({s.SlotStatus})</option>
                        ))}
                    </select>
                    <select name="plateNumber" value={form.plateNumber} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" required>
                        <option value="">Select Car</option>
                        {cars.map(c => (
                            <option key={c.plateNumber} value={c.plateNumber}>{c.plateNumber} - {c.DriverName}</option>
                        ))}
                    </select>
                    <input name="EntryTime" type="datetime-local" value={form.EntryTime} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" />
                    <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium">Start Session</button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({records.length})</button>
                        <button onClick={() => setStatusFilter('active')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === 'active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Active ({activeCount})</button>
                        <button onClick={() => setStatusFilter('completed')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === 'completed' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Completed ({completedCount})</button>
                    </div>
                    <div className="flex gap-2 flex-1 items-center">
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                        <span className="text-gray-400">-</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                    </div>
                    <div className="relative w-full md:w-48">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none transition" />
                    </div>
                </div>
            </div>

            {checkoutModal.open && (() => {
                const fee = calcFee(checkoutModal.record.EntryTime);
                const durMin = Math.max(0, (new Date() - new Date(checkoutModal.record.EntryTime)) / 60000);
                const billableHrs = Math.ceil(durMin / 60);
                return (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCheckoutModal({ ...checkoutModal, open: false })}>
                    <div className="modal-enter bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Checkout & Pay</h2>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-1">
                            <p><span className="text-gray-500">Plate:</span> <span className="font-medium text-gray-900">{checkoutModal.record.plateNumber}</span></p>
                            <p><span className="text-gray-500">Slot:</span> <span className="font-medium text-gray-900">{checkoutModal.record.SlotNumber}</span></p>
                            <p><span className="text-gray-500">Driver:</span> <span className="font-medium text-gray-900">{checkoutModal.record.DriverName || '-'}</span></p>
                            <p><span className="text-gray-500">Entry:</span> <span className="font-medium text-gray-900">{new Date(checkoutModal.record.EntryTime).toLocaleString()}</span></p>
                            <div className="border-t border-gray-200 pt-2 mt-2">
                                <p><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-900">{fmtDuration(Math.round(durMin))}</span></p>
                                <p><span className="text-gray-500">Billable hours:</span> <span className="font-medium text-gray-900">{billableHrs}</span></p>
                                <p><span className="text-gray-500">Calculated fee:</span> <span className="font-semibold text-gray-900">{fee.toLocaleString()} RWF</span></p>
                                <p className="text-xs text-gray-400 mt-1">500 RWF/hour (minimum 1 hour)</p>
                            </div>
                        </div>
                        <form onSubmit={handleCheckoutPay} className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">RWF</span>
                                <input type="number" step="1" min="1" placeholder="Amount" value={checkoutModal.amount} onChange={(e) => setCheckoutModal({ ...checkoutModal, amount: e.target.value })} className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 transition" required autoFocus />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium flex-1">Pay & Exit</button>
                                <button type="button" onClick={() => setCheckoutModal({ ...checkoutModal, open: false })} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
                );
            })()}

            {editForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditForm(null)}>
                    <div className="modal-enter bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold mb-4">Edit Record #{editForm.P_ID}</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <select name="SlotNumber" value={editForm.SlotNumber} onChange={(e) => setEditForm({ ...editForm, SlotNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" required>
                                {slots.map(s => <option key={s.SlotNumber} value={s.SlotNumber}>{s.SlotNumber}</option>)}
                            </select>
                            <select name="plateNumber" value={editForm.plateNumber} onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" required>
                                {cars.map(c => <option key={c.plateNumber} value={c.plateNumber}>{c.plateNumber}</option>)}
                            </select>
                            <input name="EntryTime" type="datetime-local" value={editForm.EntryTime} onChange={(e) => setEditForm({ ...editForm, EntryTime: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" />
                            <input name="ExitTime" type="datetime-local" value={editForm.ExitTime} onChange={(e) => setEditForm({ ...editForm, ExitTime: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" />
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium flex-1">Save</button>
                                <button type="button" onClick={() => setEditForm(null)} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                {['#', 'Slot', 'Plate', 'Driver', 'Staff', 'Entry', 'Exit', 'Duration', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="p-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="10" className="p-4"><TableSkeleton rows={5} cols={10} /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="10"><EmptyState title="No records found" description={search || statusFilter !== 'all' || dateFrom ? 'Try different filters.' : 'Start a parking session above.'} icon={FiFileText} /></td></tr>
                            ) : (
                                filtered.map((rec, i) => (
                                    <tr key={rec.P_ID} className={`border-t border-gray-100 hover:bg-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="p-3 text-gray-600">{rec.P_ID}</td>
                                        <td className="p-3 font-medium text-gray-900">{rec.SlotNumber}</td>
                                        <td className="p-3 text-gray-600">{rec.plateNumber}</td>
                                        <td className="p-3 text-gray-600">{rec.DriverName}</td>
                                        <td className="p-3 text-gray-600">{rec.UserName || '-'}</td>
                                        <td className="p-3 text-gray-600 text-sm">{rec.EntryTime ? new Date(rec.EntryTime).toLocaleString() : '-'}</td>
                                        <td className="p-3 text-gray-600 text-sm">{rec.ExitTime ? new Date(rec.ExitTime).toLocaleString() : '-'}</td>
                                        <td className="p-3 text-gray-600">{fmtDuration(rec.Duration)}</td>
                                        <td className="p-3">{statusBadge(rec.ExitTime)}</td>
                                        <td className="p-3">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {!rec.ExitTime && (
                                                    <button onClick={() => openCheckout(rec)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-700 transition flex items-center gap-1">
                                                        <FiDollarSign size={12} /> Pay & Exit
                                                    </button>
                                                )}
                                                <button onClick={() => openEdit(rec)} className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-100 transition">Edit</button>
                                                <button onClick={() => handleDelete(rec.P_ID)} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs hover:bg-red-100 transition">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ParkingRecord;
