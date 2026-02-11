import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, FileStack, LogOut, BookOpen, Settings, Users, MessageSquare, CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSidebar = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const menuItems = [
        { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Upload Notes', path: '/admin/upload', icon: Upload },
        { title: 'Manage Notes', path: '/admin/manage', icon: FileStack },
        { title: 'Users List', path: '/admin/users', icon: Users },
        { title: 'Payments', path: '/admin/payments', icon: CreditCard },
    ];

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <>
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-[60] shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pista-dark text-white rounded-xl">
                        <BookOpen size={20} />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight italic">Aurelian <span className="text-pista-dark not-italic">Admin</span></span>
                </div>
                <button
                    onClick={toggleMenu}
                    className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-transparent active:scale-95"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <LayoutDashboard size={24} />}
                </button>
            </div>

            {/* Backdrop for Mobile */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMenu}
                        className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar (Desktop & Mobile) */}
            <div className={`
                fixed top-0 left-0 bottom-0 bg-white border-r border-gray-100 z-[80] transition-all duration-500 ease-in-out
                lg:w-72 lg:translate-x-0
                ${isMobileMenuOpen ? 'w-80 translate-x-0 shadow-2xl' : 'w-80 -translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col pt-10">
                    <div className="px-8 mb-12 hidden lg:flex items-center space-x-4">
                        <div className="p-3 bg-pista-dark text-white rounded-2xl shadow-lg shadow-pista/20">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-slate-900 italic">Institutional</span>
                            <span className="text-[10px] font-black text-pista-dark uppercase tracking-[0.3em]">Insights Panel</span>
                        </div>
                    </div>

                    <div className="lg:hidden px-8 mb-12 flex items-center space-x-4 pt-10 lg:pt-0">
                        <button onClick={toggleMenu} className="p-2 bg-slate-50 rounded-xl lg:hidden">
                            <X size={20} className="text-slate-400" />
                        </button>
                        <span className="font-black text-slate-900">Close Menu</span>
                    </div>

                    <nav className="flex-1 px-6 space-y-4">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Core Management</p>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 font-black text-xs uppercase tracking-widest ${isActive
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                                        : 'text-slate-400 hover:bg-slate-50 hover:text-pista-dark'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-pista-dark' : ''} />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 mt-auto border-t border-gray-50 space-y-3 pb-10">
                        <Link
                            to="/admin/settings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-4 px-6 py-4 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                        >
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full flex items-center space-x-4 px-6 py-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                        >
                            <LogOut size={20} />
                            <span>System Exit</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
