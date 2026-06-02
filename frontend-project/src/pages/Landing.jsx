import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiGrid, FiFileText, FiDollarSign, FiBarChart2, FiArrowRight } from 'react-icons/fi';

function Landing() {
    const navigate = useNavigate();

    const features = [
        { icon: FiTruck, label: 'Car Registration', desc: 'Register and manage vehicle details' },
        { icon: FiGrid, label: 'Slot Management', desc: 'Monitor parking space availability' },
        { icon: FiFileText, label: 'Parking Records', desc: 'Track entry and exit sessions' },
        { icon: FiDollarSign, label: 'Payment Processing', desc: 'Record and manage payments' },
        { icon: FiBarChart2, label: 'Reports & Analytics', desc: 'Export data to PDF' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <nav className="flex items-center justify-between px-6 py-4 md:px-16">
                <h1 className="text-2xl font-bold text-black">PSSMS</h1>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/login')} className="text-gray-900 px-5 py-2 rounded-lg border border-gray-400 hover:bg-gray-400 hover:text-white transition">Login</button>
                    <button onClick={() => navigate('/login')} className="bg-black text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-800 transition">Get Started</button>
                </div>
            </nav>

            <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 md:pt-32">
                <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
                    Parking Space Sales<br />Management System
                </h2>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
                    Streamline your parking operations — manage slots, track vehicles, process payments, and generate reports all in one place.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/login')} className="bg-black text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-800 transition flex items-center gap-2">
                        Get Started <FiArrowRight />
                    </button>
                    <button onClick={() => navigate('/login')} className="border border-gray-400 text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-400 hover:text-white transition">
                        Sign In
                    </button>
                </div>
            </section>

            <section className="px-6 pb-20 md:px-16">
                <h3 className="text-center text-2xl font-bold text-black mb-12">What We Offer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                    {features.map((f) => (
                        <div key={f.label} className="bg-white border border-gray-400 rounded-xl p-6 text-center hover:bg-gray-400 hover:text-white transition group">
                            <f.icon className="text-gray-900 mx-auto mb-4 group-hover:text-white" size={32} />
                            <h4 className="text-black font-semibold mb-2 group-hover:text-white">{f.label}</h4>
                            <p className="text-gray-400 text-sm group-hover:text-white">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="text-center py-6 border-t border-gray-400">
                <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} PSSMS. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default Landing;
