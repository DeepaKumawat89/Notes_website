import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    MoreVertical,
    Edit3,
    Trash2,
    ExternalLink,
    ChevronDown,
    FileText,
    AlertCircle,
    Loader2
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db, storage } from '../../firebase';
import {
    collection,
    query,
    onSnapshot,
    deleteDoc,
    doc,
    orderBy
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import toast from 'react-hot-toast';

const ManageNotes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

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

    const deleteNote = async (note) => {
        if (!window.confirm(`Are you sure you want to delete "${note.title}"?`)) return;

        const toastId = toast.loading('Deleting note...');
        try {
            // 1. Delete from Storage if it's Firebase and fileUrl exists
            if (note.storageType !== 'cloudinary' && note.fileUrl) {
                try {
                    const fileRef = ref(storage, note.fileUrl);
                    await deleteObject(fileRef);
                } catch (e) {
                    console.warn("Storage deletion failed:", e);
                }
            }
            // Note: Cloudinary deletion requires API Secret, so we typically do it via a backend.
            // For now, we only remove the Firestore entry for Cloudinary files.

            // 2. Delete from Firestore
            await deleteDoc(doc(db, 'notes', note.id));
            toast.success('Note deleted successfully', { id: toastId });
        } catch (error) {
            console.error("Delete Error:", error);
            toast.error('Failed to delete note', { id: toastId });
        } finally {
            setActiveMenu(null);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream-light flex">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-pista-deep">Manage Notes</h1>
                        <p className="text-pista-deep/50 font-medium">Edit or remove study materials from the library</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark" size={20} />
                            <input
                                type="text"
                                placeholder="Filter by title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 w-72 shadow-sm"
                            />
                        </div>
                        <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-pista-light/30 rounded-2xl text-pista-deep font-bold hover:bg-pista-light transition-all shadow-sm">
                            <Filter size={20} />
                            <span>Filters</span>
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-[2.5rem] border border-pista-light/20 shadow-xl shadow-pista/5 overflow-hidden">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                            <p className="text-pista-deep/40 font-bold">Loading your repository...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-cream-light/50 border-b border-pista-light/30">
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Chapter Name</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Subject</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Class</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Stats</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pista-light/20">
                                    <AnimatePresence>
                                        {filteredNotes.map((note) => (
                                            <motion.tr
                                                key={note.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="group hover:bg-cream-light/30 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="p-3 bg-pista-light/40 rounded-xl text-pista-dark">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-pista-deep">{note.title || 'Untitled'}</p>
                                                            <p className="text-xs text-pista-deep/40 mt-0.5">
                                                                Uploaded {note.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-pista-deep/70 font-bold">{note.subjectId}</td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-pista-light text-pista-dark text-xs font-black rounded-lg uppercase">{note.classId}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-1 font-bold text-pista-deep">
                                                        <span>{note.downloads || 0}</span>
                                                        <span className="text-pista-deep/30 font-medium text-xs">DLs</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right relative">
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === note.id ? null : note.id)}
                                                        className="p-2 hover:bg-pista-light rounded-xl transition-colors text-pista-deep/40"
                                                    >
                                                        <MoreVertical size={22} />
                                                    </button>

                                                    {activeMenu === note.id && (
                                                        <div className="absolute right-8 top-16 w-52 bg-white rounded-2xl shadow-2xl border border-pista-light p-2 z-10 text-left">
                                                            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-pista-light/50 text-pista-deep font-bold transition-all">
                                                                <Edit3 size={18} className="text-blue-500" />
                                                                <span>Edit Note</span>
                                                            </button>
                                                            <a
                                                                href={note.fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-pista-light/50 text-pista-deep font-bold transition-all"
                                                            >
                                                                <ExternalLink size={18} className="text-pista-dark" />
                                                                <span>View File</span>
                                                            </a>
                                                            <div className="h-px bg-pista-light/30 my-2"></div>
                                                            <button
                                                                onClick={() => deleteNote(note)}
                                                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 font-bold transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                                <span>Delete Permanently</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredNotes.length === 0 && (
                        <div className="py-32 text-center">
                            <div className="inline-flex p-8 bg-cream-light text-pista-deep/20 rounded-full mb-8">
                                <AlertCircle size={64} />
                            </div>
                            <h3 className="text-2xl font-bold text-pista-deep">
                                {notes.length === 0 ? "No notes available" : "No matching notes found"}
                            </h3>
                            <p className="text-pista-deep/50 mt-2">
                                {notes.length === 0 ? "Start by uploading some study materials." : "Try adjusting your search filters."}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ManageNotes;

