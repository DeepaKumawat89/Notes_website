import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText, Calendar, User, Eye, Share2, Info } from 'lucide-react';
import Navbar from '../../components/Navbar';

const NoteDetail = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();

    // Dummy data for the note
    const note = {
        id: noteId,
        chapter: 'Rotational Motion',
        subject: 'Physics',
        class: '12',
        author: 'Dr. Sarah Sharma',
        date: 'Oct 12, 2025',
        size: '2.4 MB',
        pages: 42,
        downloads: 1240,
        description: 'Comprehensive notes covering Moment of Inertia, Torque, Angular Momentum, and Rolling Motion. Includes solved examples and previous year questions.',
        type: 'PDF'
    };

    return (
        <div className="min-h-screen bg-cream-light pt-32 pb-20 px-6">
            <Navbar />

            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-pista-deep mb-8 hover:text-pista-dark transition-colors font-bold"
                >
                    <ChevronLeft size={24} />
                    <span>Back to List</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-pista/5 border border-pista-light/20"
                        >
                            <div className="inline-flex px-4 py-2 bg-pista-light/50 text-pista-dark rounded-full text-xs font-bold mb-6 tracking-wide">
                                CLASS {note.class} · {note.subject}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-pista-deep mb-6 leading-tight">
                                {note.chapter}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 mb-10 pb-10 border-b border-pista-light/50">
                                <div className="flex items-center space-x-3 text-pista-deep/60">
                                    <div className="p-2 bg-cream-light rounded-lg"><User size={20} /></div>
                                    <span className="font-semibold">{note.author}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-pista-deep/60">
                                    <div className="p-2 bg-cream-light rounded-lg"><Calendar size={20} /></div>
                                    <span className="font-semibold">{note.date}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-pista-deep/60">
                                    <div className="p-2 bg-cream-light rounded-lg"><Eye size={20} /></div>
                                    <span className="font-semibold">{note.downloads} Downloads</span>
                                </div>
                            </div>

                            <div className="prose prose-pista mb-12">
                                <h3 className="text-2xl font-bold text-pista-deep mb-4">Description</h3>
                                <p className="text-pista-deep/70 text-lg leading-relaxed">
                                    {note.description}
                                </p>
                            </div>

                            <div className="p-8 bg-pista-light/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center space-x-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-pista-dark">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-pista-deep">Chapter_Roll_{noteId}.pdf</h4>
                                        <p className="text-sm text-pista-deep/50">{note.size} · {note.pages} Pages</p>
                                    </div>
                                </div>
                                <button className="w-full md:w-auto flex items-center justify-center space-x-3 px-10 py-5 bg-pista-dark text-white rounded-2xl font-bold hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-95">
                                    <Download size={24} />
                                    <span className="text-lg">Download PDF</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar/Stats */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-3xl p-8 border border-pista-light/20 shadow-lg"
                        >
                            <h3 className="font-bold text-pista-deep mb-6 flex items-center space-x-2">
                                <Info size={20} className="text-pista-dark" />
                                <span>Quick Info</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-pista-deep/50 font-medium">Format</span>
                                    <span className="font-bold text-pista-deep">PDF Document</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-pista-light/30">
                                    <span className="text-pista-deep/50 font-medium">Quality</span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">HD Print</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-pista-light/30">
                                    <span className="text-pista-deep/50 font-medium">Last Verified</span>
                                    <span className="font-bold text-pista-deep">Today</span>
                                </div>
                            </div>
                            <button className="w-full mt-8 flex items-center justify-center space-x-2 py-4 border-2 border-pista-light rounded-2xl text-pista-deep font-bold hover:bg-pista-light transition-all">
                                <Share2 size={18} />
                                <span>Share Note</span>
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-pista-dark rounded-3xl p-8 text-white shadow-xl shadow-pista/20"
                        >
                            <h3 className="font-bold text-xl mb-4">Exam Coming Soon?</h3>
                            <p className="text-pista-light/70 text-sm mb-6 leading-relaxed">
                                Check out our Premium Exam Series with important questions and mock tests.
                            </p>
                            <button className="w-full py-4 bg-white text-pista-dark rounded-2xl font-bold hover:bg-cream-light transition-all">
                                View Premium
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteDetail;
