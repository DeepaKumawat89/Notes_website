import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book, ChevronLeft, Search, Atom, Calculator, FlaskConical, Languages, Cpu, History, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const SubjectSelect = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [noteCounts, setNoteCounts] = useState({});
    const [loading, setLoading] = useState(true);

    const subjectsByClass = {
        '10': [
            { id: 'algebra', name: 'Algebra', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50' },
            { id: 'geometry', name: 'Geometry', icon: Calculator, color: 'text-purple-500', bg: 'bg-purple-50' },
            { id: 'science 1', name: 'Science 1', icon: Atom, color: 'text-orange-500', bg: 'bg-orange-50' },
            { id: 'science 2', name: 'Science 2', icon: FlaskConical, color: 'text-green-500', bg: 'bg-green-50' },
            { id: 'history', name: 'History', icon: History, color: 'text-red-500', bg: 'bg-red-50' },
            { id: 'geography', name: 'Geography', icon: Book, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { id: 'marathi', name: 'Marathi', icon: Languages, color: 'text-amber-500', bg: 'bg-amber-50' },
            { id: 'hindi', name: 'Hindi', icon: Languages, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { id: 'english', name: 'English', icon: Languages, color: 'text-cyan-500', bg: 'bg-cyan-50' },
            { id: 'sanskrit', name: 'Sanskrit', icon: Languages, color: 'text-rose-500', bg: 'bg-rose-50' },
            { id: 'information technology', name: 'IT', icon: Cpu, color: 'text-slate-500', bg: 'bg-slate-50' },
        ],
        '11': [
            { id: 'physics', name: 'Physics', icon: Atom, color: 'text-blue-500', bg: 'bg-blue-50' },
            { id: 'maths', name: 'Maths & Statistics', icon: Calculator, color: 'text-purple-500', bg: 'bg-purple-50' },
            { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, color: 'text-orange-500', bg: 'bg-orange-50' },
            { id: 'biology', name: 'Biology', icon: Book, color: 'text-green-500', bg: 'bg-green-50' },
            { id: 'it', name: 'Information Tech', icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-50' },
            { id: 'english', name: 'English', icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ],
        '12': [
            { id: 'physics', name: 'Physics', icon: Atom, color: 'text-blue-500', bg: 'bg-blue-50' },
            { id: 'maths', name: 'Maths & Statistics', icon: Calculator, color: 'text-purple-500', bg: 'bg-purple-50' },
            { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, color: 'text-orange-500', bg: 'bg-orange-50' },
            { id: 'biology', name: 'Biology', icon: Book, color: 'text-green-500', bg: 'bg-green-50' },
            { id: 'it', name: 'Information Tech', icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-50' },
            { id: 'english', name: 'English', icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ],
        'default': [
            { id: 'physics', name: 'Physics', icon: Atom, color: 'text-blue-500', bg: 'bg-blue-50' },
            { id: 'maths', name: 'Mathematics', icon: Calculator, color: 'text-purple-500', bg: 'bg-purple-50' },
            { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, color: 'text-orange-500', bg: 'bg-orange-50' },
            { id: 'biology', name: 'Biology', icon: Book, color: 'text-green-500', bg: 'bg-green-50' },
        ]
    };

    const subjects = subjectsByClass[classId] || subjectsByClass['default'];

    useEffect(() => {
        setLoading(true);
        // Listening specifically for notes of this class
        const q = query(
            collection(db, 'notes')
            // Add where('classId', '==', `Class ${classId}`) if you want to filter strictly at DB level
            // but since formats might vary, we'll fetch then filter or just fetch all and count
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const counts = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // Match classId (handling both '10' and 'Class 10' formats)
                const cId = data.classId?.toString().replace('Class ', '');

                if (cId === classId.toString()) {
                    const sId = data.subjectId?.toLowerCase();
                    if (sId) {
                        counts[sId] = (counts[sId] || 0) + 1;
                    }
                }
            });
            setNoteCounts(counts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [classId]);

    return (
        <div className="min-h-screen bg-cream-light pt-28 lg:pt-36 pb-20 px-4 sm:px-8">
            <Navbar />

            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/classes')}
                    className="flex items-center space-x-2 text-pista-deep mb-8 hover:text-pista-dark transition-colors font-bold"
                >
                    <ChevronLeft size={24} />
                    <span>Back to Classes</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold text-pista-deep mb-2">Class {classId} Subjects</h1>
                    <p className="text-pista-deep/60">Choose a subject to explore available notes and resources.</p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {subjects.map((subject, idx) => (
                        <motion.div
                            key={subject.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link
                                to={`/notes/${classId}/${subject.id}`}
                                className="group flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-pista-light/30 hover:border-pista hover:shadow-2xl hover:shadow-pista/10 transition-all duration-300"
                            >
                                <div className={`p-5 rounded-2xl ${subject.bg} ${subject.color} group-hover:scale-110 transition-transform duration-500 mb-6 relative`}>
                                    <subject.icon size={36} />
                                    {noteCounts[subject.id.toLowerCase()] > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-pista-dark text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            {noteCounts[subject.id.toLowerCase()]}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-pista-deep text-center">{subject.name}</h3>
                                <p className="text-xs text-pista-deep/40 mt-2 font-medium">
                                    {noteCounts[subject.id.toLowerCase()] || 0} Notes Available
                                </p>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubjectSelect;
