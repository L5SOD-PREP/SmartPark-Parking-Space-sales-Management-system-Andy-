import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { FiSearch, FiTruck, FiUser, FiPhone } from 'react-icons/fi';

function Car() {
    const toast = useToast();
    const [cars, setCars] = useState([]);
    const [form, setForm] = useState({ plateNumber: '', DriverName: '', phoneNumber: '' });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCars = async () => {
        try { setCars((await api.get('/cars')).data); }
        catch { toast('Failed to load cars', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCars(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!/^[\d\s\+\-\(\)]{7,20}$/.test(form.phoneNumber)) {
            toast('Enter a valid phone number (7-20 digits)', 'error');
            return;
        }
        try {
            await api.post('/cars', form);
            toast('Car added successfully', 'success');
            setForm({ plateNumber: '', DriverName: '', phoneNumber: '' });
            fetchCars();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to add car', 'error');
        }
    };

    const filtered = cars.filter((c) =>
        c.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.DriverName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Car Management</h1>
                <p className="text-gray-400 text-sm mt-1">Register and manage vehicles in the system</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Register New Car</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="plateNumber" placeholder="Plate Number" value={form.plateNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none transition" required />
                    </div>
                    <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="DriverName" placeholder="Driver Name" value={form.DriverName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none transition" required />
                    </div>
                    <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="phoneNumber" placeholder="Phone Number" value={form.phoneNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none transition" required />
                    </div>
                    <div className="md:col-span-3">
                        <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium">Add Car</button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Registered Cars</h2>
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input placeholder="Search by plate or driver..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none transition" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-xs font-semibold text-gray-600 uppercase">Plate Number</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 uppercase">Driver Name</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 uppercase">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" className="p-4"><TableSkeleton rows={4} cols={3} /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3"><EmptyState title="No cars registered" description="Add your first car using the form above." icon={FiTruck} /></td></tr>
                            ) : (
                                filtered.map((car, i) => (
                                    <tr key={car.plateNumber} className={`border-t border-gray-100 hover:bg-gray-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="p-3 font-medium text-gray-900">{car.plateNumber}</td>
                                        <td className="p-3 text-gray-600">{car.DriverName}</td>
                                        <td className="p-3 text-gray-600">{car.phoneNumber}</td>
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

export default Car;
