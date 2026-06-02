import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiTruck, FiGrid, FiFileText, FiDollarSign, FiBarChart2, FiLogOut, FiMenu, FiX, FiUser, FiLock } from 'react-icons/fi';
import { useToast } from '../components/Toast.jsx';

const menuItems = [
    { path: '/dashboard', label: 'Home', icon: FiHome },
    { path: '/cars', label: 'Car', icon: FiTruck },
    { path: '/slots', label: 'ParkingSlot', icon: FiGrid },
    { path: '/records', label: 'ParkingRecord', icon: FiFileText },
    { path: '/payments', label: 'Payment', icon: FiDollarSign },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
];

function Sidebar() {
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        toast('Logged out successfully', 'info');
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
            window.location.reload();
        }, 300);
    };

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`;

    return (
        <>
            <button
                className="fixed top-4 left-4 z-50 lg:hidden bg-black text-white p-2 rounded-md hover:bg-gray-800 transition"
                onClick={() => setOpen(!open)}
            >
                {open ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-black transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto flex flex-col`}>
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white">PSSMS</h1>
                    <p className="text-gray-400 text-sm">Parking Management</p>
                </div>

                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center">
                        <FiUser className="text-white" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{user.name || 'User'}</p>
                        <p className="text-gray-400 text-xs capitalize">{user.role || 'staff'}</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={linkClass}
                            onClick={() => setOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 space-y-1">
                    <button
                        onClick={() => { navigate('/change-password'); setOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <FiLock size={20} />
                        <span>Change Password</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
                    >
                        <FiLogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setOpen(false)} />
            )}
        </>
    );
}

export default Sidebar;
