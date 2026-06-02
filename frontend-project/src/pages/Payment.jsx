import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FiSearch, FiDollarSign } from 'react-icons/fi';

const fmtDuration = (min) => {
    const abs = Math.abs(min);
    const h = Math.floor(abs / 60);
    const m = Math.round(abs % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
};

const calcFee = (entryTime) => {
    if (!entryTime) return 500;
    const diffMin = (new Date() - new Date(entryTime)) / 60000;
    return Math.ceil(Math.max(0, diffMin) / 60) * 500;
};

function Payment() {
    const toast = useToast();
    const [payments, setPayments] = useState([]);
    const [activeRecords, setActiveRecords] = useState([]);
    const [form, setForm] = useState({ activeSession: '', AmountPaid: '' });
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [payRes, recRes] = await Promise.all([
                api.get('/payments'),
                api.get('/records'),
            ]);
            setPayments(payRes.data);
            setActiveRecords(recRes.data.filter(r => !r.ExitTime));
        } catch { toast('Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'activeSession') {
            const session = activeRecords.find(r => `${r.plateNumber}|${r.SlotNumber}` === value);
            const fee = session ? calcFee(session.EntryTime) : '';
            setForm({ activeSession: value, AmountPaid: fee.toString() });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.activeSession) {
            toast('Select an active parking session', 'error');
            return;
        }
        if (Number(form.AmountPaid) <= 0) {
            toast('Amount must be greater than 0', 'error');
            return;
        }
        const [plateNumber, SlotNumber] = form.activeSession.split('|');
        try {
            await api.post('/payments', { plateNumber, SlotNumber, AmountPaid: form.AmountPaid });
            toast('Payment recorded & vehicle checked out', 'success');
            setForm({ activeSession: '', AmountPaid: '' });
            fetchData();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to record payment', 'error');
        }
    };

    const filtered = payments.filter((p) => {
        const matchSearch = p.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
            (p.DriverName || '').toLowerCase().includes(search.toLowerCase()) ||
            p.SlotNumber?.toLowerCase().includes(search.toLowerCase());
        const date = p.PaymentDate ? new Date(p.PaymentDate) : null;
        const fromOk = !dateFrom || (date && date >= new Date(dateFrom));
        const toOk = !dateTo || (date && date <= new Date(dateTo + 'T23:59:59'));
        return matchSearch && fromOk && toOk;
    });

    const totalFiltered = filtered.reduce((s, p) => s + Number(p.AmountPaid), 0);
    const totalAll = payments.reduce((s, p) => s + Number(p.AmountPaid), 0);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-gray-400 text-sm mt-1">Record payments for active parking sessions — vehicle will be checked out automatically</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment & Checkout</h2>
                {activeRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <FiDollarSign size={40} className="mx-auto mb-3" />
                        <p>No active parking sessions. Start a session first.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select name="activeSession" value={form.activeSession} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none transition" required>
                                <option value="">Select active session</option>
                                {activeRecords.map(r => (
                                    <option key={r.P_ID} value={`${r.plateNumber}|${r.SlotNumber}`}>
                                        {r.plateNumber} - Slot {r.SlotNumber} - {r.DriverName || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">RWF</span>
                                <input name="AmountPaid" type="number" step="1" min="1" placeholder="Amount" value={form.AmountPaid} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-2.5 focus:outline-none transition" required />
                            </div>
                            <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium">Pay & Checkout</button>
                        </div>
                        {form.activeSession && (() => {
                            const session = activeRecords.find(r => `${r.plateNumber}|${r.SlotNumber}` === form.activeSession);
                            if (!session) return null;
                            const durMin = Math.max(0, (new Date() - new Date(session.EntryTime)) / 60000);
                            const billableHrs = Math.ceil(durMin / 60);
                            const fee = calcFee(session.EntryTime);
                            return (
                                <div className="bg-gray-50 rounded-lg p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                                    <p><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-900">{fmtDuration(Math.round(durMin))}</span></p>
                                    <p><span className="text-gray-500">Billable hours:</span> <span className="font-medium text-gray-900">{billableHrs}</span></p>
                                    <p><span className="text-gray-500">Suggested fee:</span> <span className="font-semibold text-gray-900">{fee.toLocaleString()} RWF</span></p>
                                    <p className="text-xs text-gray-400 w-full">500 RWF/hour (minimum 1 hour)</p>
                                </div>
                            );
                        })()}
                    </form>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-400">Date:</span>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                        <span className="text-gray-400">-</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                    </div>
                    <div className="relative w-full md:w-48 ml-auto">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none transition" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                {['Pay ID', 'Plate Number', 'Driver', 'Slot', 'Amount', 'Date'].map(h => (
                                    <th key={h} className="p-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-4"><TableSkeleton rows={5} cols={6} /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6"><EmptyState title="No payments found" description={search || dateFrom ? 'Try different filters.' : 'Record your first payment above.'} icon={FiDollarSign} /></td></tr>
                            ) : (
                                filtered.map((pay, i) => (
                                    <tr key={pay.Pay_ID} className={`border-t border-gray-100 hover:bg-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="p-3 text-gray-600">{pay.Pay_ID}</td>
                                        <td className="p-3 font-medium text-gray-900">{pay.plateNumber}</td>
                                        <td className="p-3 text-gray-600">{pay.DriverName}</td>
                                        <td className="p-3 text-gray-600">{pay.SlotNumber}</td>
                                        <td className="p-3 font-semibold text-green-700">{Number(pay.AmountPaid).toLocaleString()} RWF</td>
                                        <td className="p-3 text-gray-500 text-sm">{new Date(pay.PaymentDate).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {payments.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-600">{search || dateFrom ? 'Filtered Total' : 'Total Revenue'}</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {(search || dateFrom ? totalFiltered : totalAll).toLocaleString()} RWF
                                </p>
                            </div>
                            {(search || dateFrom) && (
                                <p className="text-xs text-gray-400 mt-1">Overall total: {totalAll.toLocaleString()} RWF</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Payment;
