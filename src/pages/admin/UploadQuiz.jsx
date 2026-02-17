import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, X, CheckCircle2, Info, Loader2, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const UploadQuiz = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [quizData, setQuizData] = useState([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDate, setQuizDate] = useState(new Date().toISOString().split('T')[0]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
                toast.error('Please upload an Excel or CSV file');
                return;
            }
            setSelectedFile(file);
            parseExcel(file);
        }
    };

    const parseExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawJson = XLSX.utils.sheet_to_json(worksheet);

                if (rawJson.length === 0) {
                    toast.error('The file appears to be empty');
                    return;
                }

                const formatted = [];
                let skippedCount = 0;

                rawJson.forEach((row, index) => {
                    // Check if row is empty (ignore empty rows at bottom of Excel)
                    if (Object.values(row).length === 0) return;

                    // Clean headers: handle case/spaces (e.g., "Option A" vs "option a ")
                    const getVal = (keys) => {
                        const foundKey = Object.keys(row).find(k =>
                            keys.some(search => k.toLowerCase().trim() === search.toLowerCase())
                        );
                        return foundKey ? row[foundKey] : undefined;
                    };

                    const question = getVal(['Question', 'Q']);
                    const optA = getVal(['Option A', 'A']);
                    const optB = getVal(['Option B', 'B']);
                    const optC = getVal(['Option C', 'C']);
                    const optD = getVal(['Option D', 'D']);

                    // Smart Answer logic: handle "A", "B", "C", "D" OR index 0-3
                    let answerRaw = getVal(['Answer', 'Correct', 'Ans']);
                    let correctAnswer = -1;

                    if (typeof answerRaw === 'string') {
                        const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                        correctAnswer = letterMap[answerRaw.toUpperCase().trim()] ?? -1;
                    }

                    if (correctAnswer === -1 && answerRaw !== undefined) {
                        correctAnswer = parseInt(answerRaw);
                    }

                    // Validation
                    const isValid = question && optA && optB && optC && optD &&
                        !isNaN(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3;

                    if (isValid) {
                        formatted.push({
                            id: index + 1,
                            question: String(question).trim(),
                            options: [String(optA), String(optB), String(optC), String(optD)],
                            correctAnswer: correctAnswer
                        });
                    } else {
                        // Only count as "skipped" if the row actually has some content
                        if (Object.keys(row).length > 0) skippedCount++;
                    }
                });

                if (skippedCount > 0) {
                    toast.error(`${skippedCount} questions were skipped. Check if all columns (Question, A, B, C, D, Answer) are filled.`);
                }

                if (formatted.length > 0) {
                    setQuizData(formatted);
                    if (!quizTitle) setQuizTitle(file.name.replace(/\.[^/.]+$/, ""));
                    toast.success(`Extracted ${formatted.length} valid questions!`);
                } else {
                    toast.error('No valid questions found in the file.');
                }
            } catch (error) {
                console.error('Error parsing excel:', error);
                toast.error('Failed to parse Excel file. Ensure headers match the template.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (quizData.length === 0) {
            toast.error('No valid quiz data to upload');
            return;
        }
        if (!quizTitle) {
            toast.error('Please enter a quiz title');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Publishing Quiz to Vault...');

        try {
            // We use the date as the ID for "Daily Quiz" or a random ID if it's a general quiz
            // For now, let's allow overlapping but suggest date-based for "Daily"
            const quizDocName = quizDate || new Date().toISOString().split('T')[0];

            await setDoc(doc(db, 'quizzes', quizDocName), {
                title: quizTitle,
                date: quizDocName,
                questions: quizData,
                createdAt: serverTimestamp(),
                totalQuestions: quizData.length,
                type: 'daily'
            });

            toast.success('Quiz Authorized and Published!', { id: toastId });
            setSelectedFile(null);
            setQuizData([]);
            setQuizTitle('');
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error('Failed to upload quiz to database.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const removeQuestion = (id) => {
        setQuizData(quizData.filter(q => q.id !== id));
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
                                <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.4em]">Knowledge Ingestion</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
                                Quiz <span className="text-pista-dark not-italic">Architect</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || quizData.length === 0}
                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-slate-200 flex items-center gap-3"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                <span>Authorize Publication</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar bg-[#F8F9FA]/50">
                    <div className="max-w-7xl mx-auto space-y-8">

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Ingestion Controls */}
                            <div className="lg:col-span-1 space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Quiz Designation</label>
                                        <input
                                            type="text"
                                            placeholder="Enter archive title..."
                                            value={quizTitle}
                                            onChange={(e) => setQuizTitle(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-pista/10 transition-all font-bold text-slate-700 shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Activation Date</label>
                                        <input
                                            type="date"
                                            value={quizDate}
                                            onChange={(e) => setQuizDate(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-pista/10 transition-all font-bold text-slate-700 shadow-inner"
                                        />
                                    </div>

                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                                        onDragLeave={() => setIsDragActive(false)}
                                        onDrop={(e) => { e.preventDefault(); setIsDragActive(false); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
                                        className={`h-48 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center group cursor-pointer ${isDragActive ? 'border-pista-dark bg-pista-light/20' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-pista-light shadow-inner'}`}
                                        onClick={() => document.getElementById('excel-upload').click()}
                                    >
                                        <input
                                            id="excel-upload"
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept=".xlsx, .xls, .csv"
                                        />
                                        {!selectedFile ? (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mb-4 shadow-sm group-hover:text-pista-dark transition-colors">
                                                    <FileSpreadsheet size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drop Manifest (.xlsx)</p>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <FileSpreadsheet size={32} className="text-pista-dark mx-auto mb-2" />
                                                <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{selectedFile.name}</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setQuizData([]); }}
                                                    className="mt-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600"
                                                >
                                                    Discard
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Data Preview */}
                            <div className="lg:col-span-2">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col"
                                >
                                    <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <div className="w-2 h-2 bg-pista-dark rounded-full" />
                                            Data Extraction Preview
                                        </h3>
                                        <span className="px-4 py-1.5 bg-pista-light/20 text-pista-dark rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {quizData.length} Nodes Extracted
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                                        {quizData.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50">
                                                <AlertCircle size={48} strokeWidth={1} />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Ingestion Manifest</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {quizData.map((q, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="p-6 rounded-3xl bg-slate-50/50 border border-transparent hover:border-pista-light/30 transition-all group relative"
                                                    >
                                                        <div className="flex gap-6">
                                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 italic">
                                                                #{idx + 1}
                                                            </div>
                                                            <div className="flex-1 space-y-4">
                                                                <h4 className="font-bold text-slate-800 leading-relaxed pr-8">{q.question}</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {q.options.map((opt, oIdx) => (
                                                                        <div
                                                                            key={oIdx}
                                                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold tracking-tight uppercase border ${q.correctAnswer === oIdx ? 'bg-pista-light/20 border-pista-dark/20 text-pista-dark' : 'bg-white border-slate-100 text-slate-400'}`}
                                                                        >
                                                                            <span className="opacity-40 mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeQuestion(q.id)}
                                                            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UploadQuiz;
