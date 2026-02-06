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
        'Class 10': [
            'Algebra',
            'Geometry',
            'Science 1',
            'Science 2',
            'History',
            'Geography',
            'English',
            'Marathi',
            'Hindi',
            'Sanskrit',
            'Information Technology'
        ],
        'Class 11': [
            'Physics', 'Maths', 'Chemistry', 'Biology', 'IT', 'English'
        ],
        'Class 12': [
            'Physics', 'Maths', 'Chemistry', 'Biology', 'IT', 'English'
        ]
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
            toast.error('Cloudinary Cloud Name not configured in .env');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Uploading notes to Cloudinary...');

        try {
            // 1. Upload file to Cloudinary
            const data = new FormData();
            data.append('file', selectedFile);
            data.append('upload_preset', uploadPreset);
            data.append('cloud_name', cloudName);
            data.append('resource_type', 'auto'); // Auto handles PDF

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                method: 'POST',
                body: data
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Cloudinary upload failed');
            }

            const cloudData = await response.json();
            const downloadURL = cloudData.secure_url;

            // Generate Thumbnail URL (First page of PDF as JPG)
            // Replace .pdf with .jpg and add page 1 transformation
            const thumbnailUrl = downloadURL.replace(/\.[^/.]+$/, "") + ".jpg";
            const transformedThumbnail = thumbnailUrl.replace("/upload/", "/upload/pg_1,w_400,h_600,c_fill,g_north/");

            // 2. Save metadata to Firestore
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

            toast.success('Notes published successfully!', { id: toastId });
            setSelectedFile(null);
            setFormData({ ...formData, title: '', description: '' });
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error(error.message || 'Failed to upload notes.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream-light flex">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold text-pista-deep">Upload Notes</h1>
                    <p className="text-pista-deep/50 font-medium">Add new study materials to the library</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Form Side */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 border border-pista-light/20 shadow-xl shadow-pista/5"
                        >
                            <form onSubmit={handleUpload} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Custom Class Dropdown */}
                                    <div className="space-y-3 relative">
                                        <label className="text-sm font-bold text-pista-deep/70 ml-1">Academic Class</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => { setIsClassOpen(!isClassOpen); setIsSubjectOpen(false); }}
                                                className="w-full px-6 py-4 bg-cream-light border border-pista-light/30 rounded-2xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pista/20 focus:border-pista transition-all font-bold text-pista-deep group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-pista-dark text-white rounded-lg flex items-center justify-center text-xs">
                                                        {formData.classId.split(' ')[1]}
                                                    </div>
                                                    <span>{formData.classId}</span>
                                                </div>
                                                <ChevronDown className={`text-pista-deep/40 transition-transform duration-300 ${isClassOpen ? 'rotate-180' : ''}`} size={20} />
                                            </button>

                                            <AnimatePresence>
                                                {isClassOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute z-50 mt-2 w-full bg-white border border-pista-light/20 rounded-2xl shadow-2xl shadow-pista/10 overflow-hidden backdrop-blur-xl bg-white/90"
                                                    >
                                                        {['Class 10', 'Class 11', 'Class 12'].map((cls) => (
                                                            <button
                                                                key={cls}
                                                                type="button"
                                                                onClick={() => { handleClassChange(cls); setIsClassOpen(false); }}
                                                                className={`w-full px-6 py-4 text-left hover:bg-pista-light/30 transition-colors flex items-center justify-between font-bold ${formData.classId === cls ? 'text-pista-dark bg-pista-light/20' : 'text-pista-deep/60'}`}
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

                                    {/* Custom Subject Dropdown */}
                                    <div className="space-y-3 relative">
                                        <label className="text-sm font-bold text-pista-deep/70 ml-1">Subject</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => { setIsSubjectOpen(!isSubjectOpen); setIsClassOpen(false); }}
                                                className="w-full px-6 py-4 bg-cream-light border border-pista-light/30 rounded-2xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pista/20 focus:border-pista transition-all font-bold text-pista-deep group"
                                            >
                                                <div className="flex items-center gap-3 italic">
                                                    <div className="w-8 h-8 bg-pista-light text-pista-dark rounded-lg flex items-center justify-center font-black">
                                                        {formData.subjectId.charAt(0)}
                                                    </div>
                                                    <span className="capitalize">{formData.subjectId}</span>
                                                </div>
                                                <ChevronDown className={`text-pista-deep/40 transition-transform duration-300 ${isSubjectOpen ? 'rotate-180' : ''}`} size={20} />
                                            </button>

                                            <AnimatePresence>
                                                {isSubjectOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute z-50 mt-2 w-full bg-white border border-pista-light/20 rounded-2xl shadow-2xl shadow-pista/10 overflow-hidden backdrop-blur-xl bg-white/90 max-h-64 overflow-y-auto"
                                                    >
                                                        {(subjectsData[formData.classId] || []).map((sub) => (
                                                            <button
                                                                key={sub}
                                                                type="button"
                                                                onClick={() => { setFormData({ ...formData, subjectId: sub }); setIsSubjectOpen(false); }}
                                                                className={`w-full px-6 py-4 text-left hover:bg-pista-light/30 transition-colors flex items-center justify-between font-bold ${formData.subjectId === sub ? 'text-pista-dark bg-pista-light/20' : 'text-pista-deep/60'}`}
                                                            >
                                                                <span className="capitalize">{sub}</span>
                                                                {formData.subjectId === sub && <div className="w-2 h-2 bg-pista-dark rounded-full" />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-pista-deep/70 ml-1">Chapter Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Thermodynamics Part 1"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-cream-light border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 focus:border-pista transition-all font-medium text-pista-deep"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-pista-deep/70 ml-1">Short Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Provide a brief overview of the topics covered..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-6 py-4 bg-cream-light border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 focus:border-pista transition-all font-medium text-pista-deep resize-none"
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full flex items-center justify-center space-x-3 py-5 bg-pista-dark text-white rounded-2xl font-bold hover:bg-pista-deep hover:shadow-xl hover:shadow-pista/20 transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                        <span className="text-lg">{uploading ? 'Processing...' : 'Publish Notes'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Upload Side */}
                    <div>
                        <motion.div
                            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                            onDragLeave={() => setIsDragActive(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragActive(false); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
                            className={`h-96 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center p-10 text-center relative overflow-hidden ${isDragActive ? 'border-pista bg-pista-light/30' : 'border-pista-light/50 bg-white hover:border-pista-light/80'
                                }`}
                        >
                            {!selectedFile ? (
                                <>
                                    <div className="p-6 bg-cream-light rounded-3xl text-pista mb-6">
                                        <Upload size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-pista-deep mb-2">Drag & Drop PDF</h3>
                                    <p className="text-pista-deep/40 text-sm mb-8 leading-relaxed">
                                        Limit 50MB per file. High-resolution PDFs are preferred for better readability.
                                    </p>
                                    <label className="px-8 py-3 bg-pista-light text-pista-dark rounded-xl font-bold cursor-pointer hover:bg-pista transition-all active:scale-95">
                                        Browse Files
                                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                                    </label>
                                </>
                            ) : (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-full">
                                    <div className="p-6 bg-pista-light rounded-3xl text-pista-dark mb-6 inline-block">
                                        <FileText size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-pista-deep truncate max-w-full px-4 mb-2">{selectedFile.name}</h3>
                                    <p className="text-pista-deep/40 text-sm mb-8">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="flex items-center space-x-2 px-6 py-2 text-red-500 font-bold hover:bg-red-50 rounded-lg mx-auto transition-colors"
                                    >
                                        <X size={18} />
                                        <span>Remove File</span>
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>

                        <div className="mt-8 bg-white/50 border border-pista-light/30 rounded-3xl p-8">
                            <h4 className="flex items-center space-x-3 text-pista-deep font-bold mb-4">
                                <Info size={18} className="text-pista-dark" />
                                <span>Upload Guidelines</span>
                            </h4>
                            <ul className="space-y-3 text-sm text-pista-deep/60">
                                <li className="flex items-start space-x-2">
                                    <span className="mt-1 w-1.5 h-1.5 bg-pista-dark rounded-full shrink-0"></span>
                                    <span>Ensure all equations are legible.</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="mt-1 w-1.5 h-1.5 bg-pista-dark rounded-full shrink-0"></span>
                                    <span>Include diagrams for science subjects.</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="mt-1 w-1.5 h-1.5 bg-pista-dark rounded-full shrink-0"></span>
                                    <span>Max 100 pages per document.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UploadNote;

