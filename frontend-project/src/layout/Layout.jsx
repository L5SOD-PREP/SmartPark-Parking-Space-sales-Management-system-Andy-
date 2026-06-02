import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

function Layout({ children }) {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <main className="flex-1 overflow-auto p-4 md:p-6">
                <div key={location.pathname} className="page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default Layout;
