import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, ChevronDown, Plus, Info, Loader2 } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const UploadNote = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        classId: 'Class 10',
        subjectId: 'Algebra',
        title: '',
        description: ''
    });
    const [isClassOpen, setIsClassOpen] = useState(false);
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);

    const subjectsData = {
        'Class 10': ['Algebra', 'Geometry', 'Science 1', 'Science 2', 'History', 'Geography', 'English', 'Marathi', 'Hindi', 'Sanskrit', 'Information Technology'],
        'Class 11': ['Physics', 'Maths', 'Chemistry', 'Biology', 'IT', 'English'],
        'Class 12': ['Physics', 'Maths', 'Chemistry', 'Biology', 'IT', 'English']
    };

    const handleClassChange = (newClass) => {
        setFormData({
            ...formData,
            classId: newClass,
            subjectId: subjectsData[newClass][0]
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Please upload a PDF file');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }
        if (!formData.title) {
            toast.error('Please enter a chapter name');
            return;
        }

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || cloudName === 'your_cloud_name') {
            toast.error('Cloudinary Cloud Name not configured');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Publishing to Repository...');

        try {
            const data = new FormData();
            data.append('file', selectedFile);
            data.append('upload_preset', uploadPreset);
            data.append('cloud_name', cloudName);
            data.append('resource_type', 'auto');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                method: 'POST',
                body: data
            });

            if (!response.ok) throw new Error('Cloudinary upload failed');

            const cloudData = await response.json();
            const downloadURL = cloudData.secure_url;
            const thumbnailUrl = downloadURL.replace(/\.[^/.]+$/, "") + ".jpg";
            const transformedThumbnail = thumbnailUrl.replace("/upload/", "/upload/pg_1,w_400,h_600,c_fill,g_north/");

            await addDoc(collection(db, 'notes'), {
                ...formData,
                fileUrl: downloadURL,
                thumbnailUrl: transformedThumbnail,
                fileName: selectedFile.name,
                size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
                createdAt: serverTimestamp(),
                downloads: 0,
                storageType: 'cloudinary'
            });

            toast.success('Resource Published!', { id: toastId });
            setSelectedFile(null);
            setFormData({ ...formData, title: '', description: '' });
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error(error.message || 'Failed to upload.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex font-sans selection:bg-pista-light">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden pt-20 lg:pt-0">
                {/* Premium Header */}
                <header className="px-6 py-6 lg:px-10 lg:py-10 bg-white border-b border-gray-100 z-30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-2 w-10 bg-pista-dark rounded-full" />
                                <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.4em]">Asset Ingestion</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
                                Institutional <span className="text-pista-dark not-italic">Vault</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-[10px] font-black text-pista-dark uppercase tracking-widest">Storage Status</p>
                                <p className="text-xs font-bold text-slate-400">92% Available</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-pista-light/30 flex items-center justify-center text-pista-dark">
                                <Info size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar bg-[#F8F9FA]/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Form Section */}
                            <div className="lg:col-span-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-12 border border-gray-100 shadow-sm"
                                >
                                    <form onSubmit={handleUpload} className="space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Class Select */}
                                            <div className="space-y-4 relative">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Academic Grade</label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsClassOpen(!isClassOpen); setIsSubjectOpen(false); }}
                                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl flex items-center justify-between focus:ring-4 focus:ring-pista/10 transition-all font-black text-slate-800 shadow-inner group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs italic">
                                                                {formData.classId.split(' ')[1]}
                                                            </div>
                                                            <span>{formData.classId}</span>
                                                        </div>
                                                        <ChevronDown className={`text-slate-300 transition-transform duration-500 ${isClassOpen ? 'rotate-180' : ''}`} size={20} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isClassOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute z-50 mt-4 w-full bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl"
                                                            >
                                                                {['Class 10', 'Class 11', 'Class 12'].map((cls) => (
                                                                    <button
                                                                        key={cls}
                                                                        type="button"
                                                                        onClick={() => { handleClassChange(cls); setIsClassOpen(false); }}
                                                                        className={`w-full px-8 py-5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between font-black text-xs uppercase tracking-widest ${formData.classId === cls ? 'text-pista-dark bg-pista-light/10' : 'text-slate-400'}`}
                                                                    >
                                                                        <span>{cls}</span>
                                                                        {formData.classId === cls && <div className="w-2 h-2 bg-pista-dark rounded-full" />}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Subject Select */}
                                            <div className="space-y-4 relative">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Knowledge Domain</label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsSubjectOpen(!isSubjectOpen); setIsClassOpen(false); }}
                                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl flex items-center justify-between focus:ring-4 focus:ring-pista/10 transition-all font-black text-slate-800 shadow-inner group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-pista-light/50 text-pista-dark rounded-xl flex items-center justify-center font-black italic">
                                                                {formData.subjectId.charAt(0)}
                                                            </div>
                                                            <span className="capitalize">{formData.subjectId}</span>
                                                        </div>
                                                        <ChevronDown className={`text-slate-300 transition-transform duration-500 ${isSubjectOpen ? 'rotate-180' : ''}`} size={20} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isSubjectOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute z-50 mt-4 w-full bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl max-h-80 overflow-y-auto custom-scrollbar"
                                                            >
                                                                {(subjectsData[formData.classId] || []).map((sub) => (
                                                                    <button
                                                                        key={sub}
                                                                        type="button"
                                                                        onClick={() => { setFormData({ ...formData, subjectId: sub }); setIsSubjectOpen(false); }}
                                                                        className={`w-full px-8 py-5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between font-black text-[10px] uppercase tracking-widest ${formData.subjectId === sub ? 'text-pista-dark bg-pista-light/10' : 'text-slate-400'}`}
                                                                    >
                                                                        <span>{sub}</span>
                                                                        {formData.subjectId === sub && <div className="w-2 h-2 bg-pista-dark rounded-full" />}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Manuscript Title</label>
                                            <input
                                                type="text"
                                                placeholder="Enter identifying title..."
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-pista/10 transition-all font-bold text-slate-700 shadow-inner"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Abstract / Meta Description</label>
                                            <textarea
                                                rows="5"
                                                placeholder="Provide a comprehensive summary of contents..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-4 focus:ring-pista/10 transition-all font-bold text-slate-700 shadow-inner resize-none leading-relaxed"
                                            ></textarea>
                                        </div>

                                        <div className="pt-6">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={uploading}
                                                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-black hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center space-x-4"
                                            >
                                                {uploading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} strokeWidth={2.5} />}
                                                <span>{uploading ? 'Processing Data...' : 'Authorize Publication'}</span>
                                            </motion.button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>

                            {/* Resource Sidebar */}
                            <div className="space-y-10">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                                    onDragLeave={() => setIsDragActive(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragActive(false); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
                                    className={`h-[400px] rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center relative overflow-hidden ${isDragActive ? 'border-pista-dark bg-pista-light/20' : 'border-slate-100 bg-white hover:border-pista-light/50 shadow-sm'}`}
                                >
                                    {!selectedFile ? (
                                        <>
                                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 shadow-inner group-hover:bg-pista-dark group-hover:text-white transition-all">
                                                <Upload size={48} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 italic">Ingest PDF</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-10 max-w-[200px] mx-auto">
                                                Maximum File Capacity: 50MB. Adobe Optimized PDFs Preferred.
                                            </p>
                                            <label className="px-10 py-4 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-black transition-all shadow-xl shadow-slate-200">
                                                Select Archive
                                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                                            </label>
                                        </>
                                    ) : (
                                        <div className="w-full">
                                            <div className="w-24 h-24 bg-pista-dark rounded-[2.5rem] flex items-center justify-center text-white mb-8 mx-auto shadow-2xl">
                                                <FileText size={48} strokeWidth={2} />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 truncate px-4 mb-2 italic">{selectedFile.name}</h3>
                                            <p className="text-[10px] font-black text-pista-dark uppercase tracking-widest mb-10 italic">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            <button
                                                onClick={() => setSelectedFile(null)}
                                                className="flex items-center space-x-3 px-8 py-3 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 rounded-full mx-auto transition-colors"
                                            >
                                                <X size={18} strokeWidth={3} />
                                                <span>Expunge</span>
                                            </button>
                                        </div>
                                    )}
                                </motion.div>

                                <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
                                    <h4 className="flex items-center space-x-4 text-slate-900 font-black uppercase tracking-widest text-xs mb-8 italic">
                                        <Info size={18} className="text-pista-dark" />
                                        <span>Publication Specs</span>
                                    </h4>
                                    <ul className="space-y-6">
                                        {[
                                            'Verify legibility of complex equations.',
                                            'Embed schematic diagrams for Science.',
                                            'Pagination limit: 120 pages per log.',
                                            'OCR capability recommended.'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start space-x-4">
                                                <div className="mt-1 w-1.5 h-4 bg-pista-dark rounded-full shrink-0"></div>
                                                <span className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UploadNote;

