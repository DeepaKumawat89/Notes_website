import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, FileStack, LogOut, BookOpen, Settings, Users, MessageSquare, CreditCard } from 'lucide-react';

const AdminSidebar = () => {
    const location = useLocation();

    const menuItems = [
        { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Upload Notes', path: '/admin/upload', icon: Upload },
        { title: 'Manage Notes', path: '/admin/manage', icon: FileStack },
        { title: 'Users List', path: '/admin/users', icon: Users },
        { title: 'Payments', path: '/admin/payments', icon: CreditCard },
        { title: 'Requests', path: '/admin/requests', icon: MessageSquare },
    ];

    return (
        <>
            {/* Mobile Header - only shown on small screens */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-pista-light flex items-center justify-between px-6 z-50">
                <div className="flex items-center space-x-2">
                    <BookOpen className="text-pista-dark" size={24} />
                    <span className="font-bold text-pista-deep">Admin</span>
                </div>
                <button className="p-2 text-pista-deep">
                    <LayoutDashboard size={24} />
                </button>
            </div>

            <div className="hidden lg:flex w-72 bg-white border-r border-pista-light min-h-screen flex-col fixed left-0 top-0 pt-8 z-40">
                <div className="px-8 mb-12 flex items-center space-x-3">
                    <div className="p-2 bg-pista-dark text-white rounded-xl">
                        <BookOpen size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-pista-deep">Admin Panel</span>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all font-bold ${isActive
                                    ? 'bg-pista-dark text-white shadow-lg shadow-pista/20'
                                    : 'text-pista-deep/60 hover:bg-pista-light/30 hover:text-pista-dark'
                                    }`}
                            >
                                <item.icon size={22} />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto space-y-2">
                    <Link to="/admin/settings" className="flex items-center space-x-4 px-4 py-4 text-pista-deep/60 hover:bg-pista-light/30 rounded-2xl transition-all font-bold">
                        <Settings size={22} />
                        <span>Settings</span>
                    </Link>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full flex items-center space-x-4 px-4 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold"
                    >
                        <LogOut size={22} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
