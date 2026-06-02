import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FiBarChart2, FiDownload, FiFileText, FiDollarSign, FiSearch } from 'react-icons/fi';

function fmtDuration(min) {
    if (!min) return 'Active';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m} min`;
}

function Reports() {
    const toast = useToast();
    const [records, setRecords] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('records');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const tableRef = useRef();

    const fetchData = async () => {
        try {
            const [recRes, payRes] = await Promise.all([
                api.get('/records'),
                api.get('/payments'),
            ]);
            setRecords(recRes.data);
            setPayments(payRes.data);
        } catch { toast('Failed to load report data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredRecords = records.filter((r) => {
        const matchSearch = !search || r.SlotNumber?.toLowerCase().includes(search.toLowerCase()) ||
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

    const filteredPayments = payments.filter((p) => {
        const matchSearch = !search || p.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
            (p.DriverName || '').toLowerCase().includes(search.toLowerCase()) ||
            p.SlotNumber?.toLowerCase().includes(search.toLowerCase());
        const date = p.PaymentDate ? new Date(p.PaymentDate) : null;
        const fromOk = !dateFrom || (date && date >= new Date(dateFrom));
        const toOk = !dateTo || (date && date <= new Date(dateTo + 'T23:59:59'));
        return matchSearch && fromOk && toOk;
    });

    const displayedData = activeTab === 'records' ? filteredRecords : filteredPayments;

    const exportPDF = () => {
        if (displayedData.length === 0) {
            toast('No data to export', 'error');
            return;
        }
        const doc = new jsPDF('landscape');
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('PSSMS Report', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Report: ${activeTab === 'records' ? 'Parking Records' : 'Payments'}`, 14, 35);

        const columns = activeTab === 'records'
            ? [['ID', 'Slot', 'Plate', 'Driver', 'Staff', 'Entry', 'Exit', 'Duration', 'Status']]
            : [['Pay ID', 'Plate', 'Driver', 'Slot', 'Amount', 'Date']];

        const rows = activeTab === 'records'
            ? displayedData.map(r => [r.P_ID, r.SlotNumber, r.plateNumber, r.DriverName || '-', r.UserName || '-', r.EntryTime ? new Date(r.EntryTime).toLocaleString() : '-', r.ExitTime ? new Date(r.ExitTime).toLocaleString() : '-', fmtDuration(r.Duration), r.ExitTime ? 'Completed' : 'Active'])
            : displayedData.map(p => [p.Pay_ID, p.plateNumber, p.DriverName || '-', p.SlotNumber, `${Number(p.AmountPaid).toLocaleString()} RWF`, new Date(p.PaymentDate).toLocaleDateString()]);

        doc.autoTable({ head: columns, body: rows, startY: 42, theme: 'grid', headStyles: { fillColor: [0, 0, 0] } });
        if (activeTab === 'payments') {
            const total = displayedData.reduce((sum, p) => sum + Number(p.AmountPaid), 0);
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Revenue: ${total.toLocaleString()} RWF`, 14, doc.lastAutoTable.finalY + 10);
        }
        doc.save(`PSSMS_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast('PDF exported successfully', 'success');
    };

    const statusBadge = (exitTime) => exitTime
        ? <span className="px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: '#ECFDF5', color: '#22C55E', borderColor: '#22C55E' }}>Completed</span>
        : <span className="px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: '#FFFBEB', color: '#F59E0B', borderColor: '#F59E0B' }}>Active</span>;

    const activeCount = records.filter(r => !r.ExitTime).length;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-400 text-sm mt-1">View and export parking data</p>
                </div>
                <button onClick={exportPDF} className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2">
                    <FiDownload size={18} /> Export PDF
                </button>
            </div>

            <div className="flex mb-6 bg-white rounded-lg border border-gray-200 p-1">
                <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'records' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('records')}>
                    <FiFileText size={16} /> Parking Records
                </button>
                <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'payments' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('payments')}>
                    <FiDollarSign size={16} /> Payments
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
                    {activeTab === 'records' && (
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({records.length})</button>
                            <button onClick={() => setStatusFilter('active')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === 'active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Active ({activeCount})</button>
                            <button onClick={() => setStatusFilter('completed')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${statusFilter === 'completed' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Completed ({records.length - activeCount})</button>
                        </div>
                    )}
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

            <div className="bg-white rounded-xl border border-gray-200 p-6" ref={tableRef}>
                {loading ? (
                    <TableSkeleton rows={6} cols={activeTab === 'records' ? 9 : 6} />
                ) : activeTab === 'records' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    {['ID', 'Slot', 'Plate', 'Driver', 'Staff', 'Entry', 'Exit', 'Duration', 'Status'].map(h => (
                                        <th key={h} className="p-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr><td colSpan="9"><EmptyState title="No parking records" description={search || statusFilter !== 'all' || dateFrom ? 'Try different filters.' : null} icon={FiBarChart2} /></td></tr>
                                ) : (
                                    filteredRecords.map((r, i) => (
                                        <tr key={r.P_ID} className={`border-t border-gray-100 hover:bg-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="p-3 text-gray-600">{r.P_ID}</td>
                                            <td className="p-3 font-medium text-gray-900">{r.SlotNumber}</td>
                                            <td className="p-3 text-gray-600">{r.plateNumber}</td>
                                            <td className="p-3 text-gray-600">{r.DriverName || '-'}</td>
                                            <td className="p-3 text-gray-600">{r.UserName || '-'}</td>
                                            <td className="p-3 text-gray-600 text-sm">{r.EntryTime ? new Date(r.EntryTime).toLocaleString() : '-'}</td>
                                            <td className="p-3 text-gray-600 text-sm">{r.ExitTime ? new Date(r.ExitTime).toLocaleString() : '-'}</td>
                                            <td className="p-3 text-gray-600">{fmtDuration(r.Duration)}</td>
                                            <td className="p-3">{statusBadge(r.ExitTime)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    {['Pay ID', 'Plate', 'Driver', 'Slot', 'Amount', 'Date'].map(h => (
                                        <th key={h} className="p-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.length === 0 ? (
                                    <tr><td colSpan="6"><EmptyState title="No payments found" description={search || dateFrom ? 'Try different filters.' : null} icon={FiDollarSign} /></td></tr>
                                ) : (
                                    filteredPayments.map((p, i) => (
                                        <tr key={p.Pay_ID} className={`border-t border-gray-100 hover:bg-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="p-3 text-gray-600">{p.Pay_ID}</td>
                                            <td className="p-3 font-medium text-gray-900">{p.plateNumber}</td>
                                            <td className="p-3 text-gray-600">{p.DriverName || '-'}</td>
                                            <td className="p-3 text-gray-600">{p.SlotNumber}</td>
                                            <td className="p-3 font-semibold text-green-700">{Number(p.AmountPaid).toLocaleString()} RWF</td>
                                            <td className="p-3 text-gray-500 text-sm">{new Date(p.PaymentDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {filteredPayments.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-gray-600">{search || dateFrom ? 'Filtered Total' : 'Total Revenue'}</p>
                                    <p className="text-lg font-bold text-gray-900">{filteredPayments.reduce((s, p) => s + Number(p.AmountPaid), 0).toLocaleString()} RWF</p>
                                </div>
                                {(search || dateFrom) && (
                                    <p className="text-xs text-gray-400 mt-1">Overall total: {payments.reduce((s, p) => s + Number(p.AmountPaid), 0).toLocaleString()} RWF</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Reports;
