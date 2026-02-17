import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Edit3,
    Trash2,
    ExternalLink,
    FileText,
    AlertCircle,
    Loader2,
    Download,
    Calendar,
    ArrowRight,
    SearchX,
    MoreHorizontal,
    Settings2,
    BookOpen,
    X
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db, storage } from '../../firebase';
import {
    collection,
    query,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    orderBy
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import toast from 'react-hot-toast';

const ManageNotes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [editingNote, setEditingNote] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', subjectId: '', classId: '' });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotes(notesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subjectId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteNote = async (note) => {
        if (!window.confirm(`Permanently delete "${note.title}"?`)) return;

        const toastId = toast.loading('Removing file...');
        try {
            if (note.storageType !== 'cloudinary' && note.fileUrl) {
                try {
                    const fileRef = ref(storage, note.fileUrl);
                    await deleteObject(fileRef);
                } catch (e) {
                    console.warn("Storage deletion failed:", e);
                }
            }
            await deleteDoc(doc(db, 'notes', note.id));
            toast.success('Note deleted successfully', { id: toastId });
        } catch (error) {
            console.error("Delete Error:", error);
            toast.error('Failed to delete note', { id: toastId });
        } finally {
            setActiveActionMenu(null);
        }
    };

    const handleEditClick = (note) => {
        setEditingNote(note);
        setEditForm({
            title: note.title,
            subjectId: note.subjectId,
            classId: note.classId
        });
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editForm.title || !editForm.subjectId || !editForm.classId) {
            toast.error("Please fill all fields");
            return;
        }

        setUpdating(true);
        const toastId = toast.loading("Updating record...");
        try {
            await updateDoc(doc(db, 'notes', editingNote.id), {
                title: editForm.title,
                subjectId: editForm.subjectId,
                classId: editForm.classId,
                updatedAt: new Date()
            });
            toast.success("Record updated successfully", { id: toastId });
            setEditingNote(null);
        } catch (error) {
            console.error("Update Error:", error);
            toast.error("Failed to update record", { id: toastId });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex font-sans selection:bg-pista-light">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden pt-20 lg:pt-0">
                {/* Stunning Header */}
                <header className="px-4 py-4 lg:px-10 lg:py-10 flex flex-col lg:flex-row justify-between lg:items-center bg-white border-b border-gray-100 z-20 gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="hidden lg:flex items-center space-x-3 mb-2">
                            <div className="h-2 w-10 bg-pista-dark rounded-full" />
                            <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.4em]">Resource Management</span>
                        </div>
                        <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">Manage <span className="text-pista-dark italic">Notes</span></h1>
                    </div>

                    <div className="flex items-center space-x-3 w-full lg:w-auto">
                        <div className="relative group flex-1 lg:flex-none">
                            <Search className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pista-dark transition-colors w-[18px] h-[18px] lg:w-5 lg:h-5" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 lg:pl-14 pr-8 py-3 lg:py-5 bg-slate-50 border-none rounded-xl lg:rounded-[2rem] focus:ring-4 focus:ring-pista/10 w-full lg:w-80 font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner text-sm lg:text-base"
                            />
                        </div>
                        <button className="p-3 lg:p-5 bg-white border border-gray-100 rounded-full hover:bg-slate-50 transition-all shadow-sm text-slate-400">
                            <Settings2 className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>
                    </div>
                </header>

                {/* Vertical List Container */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar bg-[#F8F9FA]/50">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="p-4 bg-white rounded-3xl shadow-xl shadow-pista/10 text-pista-dark mb-6"
                                >
                                    <Loader2 size={48} />
                                </motion.div>
                                <p className="text-slate-400 font-black tracking-widest text-[10px] uppercase">Retrieving Records...</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredNotes.length > 0 ? (
                                    filteredNotes.map((note, index) => (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group relative bg-white rounded-[2rem] border border-gray-100 p-2 flex flex-col md:flex-row md:items-center hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-pista-light/30 transition-all duration-500 overflow-hidden"
                                        >
                                            {/* Left Section: Icon & Identity */}
                                            <div className="flex items-center space-x-6 p-4 md:pr-10 border-b md:border-b-0 md:border-r border-gray-50 bg-slate-50/50 rounded-t-[1.8rem] md:rounded-l-[1.8rem] md:rounded-tr-none">
                                                <div className="relative">
                                                    <div className="p-5 bg-white rounded-2xl text-slate-400 group-hover:bg-pista-dark group-hover:text-white transition-all duration-500 shadow-sm">
                                                        <FileText size={32} />
                                                    </div>
                                                    <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center text-xs font-black text-pista-dark shadow-sm">
                                                        {note.classId}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center Section: Main Info */}
                                            <div className="flex-1 px-6 md:px-10 py-6 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="px-3 py-1 bg-pista-light/40 text-pista-dark text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                        {note.subjectId}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                        Ref: {note.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate leading-tight group-hover:text-pista-deep transition-colors">
                                                    {note.title}
                                                </h3>
                                                <div className="flex items-center space-x-6 mt-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        <span className="text-[10px] md:text-xs font-bold text-slate-400">
                                                            {note.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section: Actions */}
                                            <div className="flex items-center justify-between md:justify-end space-x-3 p-6 md:pr-10 bg-slate-50/30 md:bg-transparent border-t md:border-t-0 border-gray-50">
                                                <div className="flex items-center space-x-2">
                                                    <a
                                                        href={note.fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-3 md:p-4 bg-white md:bg-slate-50 text-slate-400 rounded-2xl hover:bg-pista-dark hover:text-white transition-all shadow-sm border border-gray-100 md:border-transparent"
                                                        title="Preview Asset"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleEditClick(note)}
                                                        className="p-3 md:p-4 bg-white md:bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-gray-100 md:border-transparent"
                                                        title="Edit Record"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNote(note)}
                                                        className="p-3 md:p-4 bg-white md:bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-100 md:border-transparent"
                                                        title="Expunge Note"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div className="hidden lg:flex pl-6 ml-6 border-l border-gray-100 items-center h-12">
                                                    <div className="h-10 w-10 rounded-full border-2 border-slate-50 bg-white flex items-center justify-center text-slate-200 group-hover:bg-pista-light group-hover:text-pista-dark transition-all cursor-pointer">
                                                        <ArrowRight size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-40 flex flex-col items-center justify-center text-center">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-100 mb-8 border border-gray-100 shadow-inner">
                                            <SearchX size={52} />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">No Records Found</h3>
                                        <p className="text-slate-400 font-bold max-w-sm mt-2 text-sm">We couldn't find any resources matching your current search parameters. Try adjusting your query.</p>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-8 px-10 py-4 bg-pista-dark text-white rounded-full font-black uppercase text-xs tracking-widest hover:bg-pista-deep transition-all shadow-xl shadow-pista/20"
                                        >
                                            Reset Archive
                                        </button>
                                    </div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <footer className="px-10 py-4 bg-white border-t border-gray-50 flex justify-between items-center z-20">
                    <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        <div className="flex items-center space-x-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-pista-dark" />
                            <span>Cloud Storage: Secure</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>{notes.length} Total Assets</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-pista-deep/20">Aurelian Admin Management Portal v4.2</span>
                    </div>
                </footer>
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingNote && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingNote(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="relative p-10">
                                <button
                                    onClick={() => setEditingNote(null)}
                                    className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                <div className="mb-8">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="h-1.5 w-6 bg-pista-dark rounded-full" />
                                        <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.3em]">Manifest Update</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Edit <span className="text-pista-dark italic">Record</span></h2>
                                </div>

                                <form onSubmit={handleUpdateNote} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Note Title</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-pista/10 font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
                                            placeholder="Ex: Calculus Chapter 1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject</label>
                                            <input
                                                type="text"
                                                value={editForm.subjectId}
                                                onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-pista/10 font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
                                                placeholder="Subject ID"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Grade Level</label>
                                            <input
                                                type="text"
                                                value={editForm.classId}
                                                onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-pista/10 font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
                                                placeholder="Class"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="w-full py-5 bg-pista-dark text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3"
                                        >
                                            {updating ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                <>
                                                    <span>Authorize Changes</span>
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageNotes;
