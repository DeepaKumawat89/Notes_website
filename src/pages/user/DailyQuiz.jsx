import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Zap, Timer, CheckCircle, XCircle, Award, ChevronRight, Loader2, Home as HomeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';

const DailyQuiz = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [alreadyTaken, setAlreadyTaken] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    const todayDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchQuizAndStatus = async () => {
            if (!auth.currentUser) {
                toast.error("Please login to take the quiz");
                navigate('/login');
                return;
            }

            try {
                // 1. Check if already taken
                const submissionRef = doc(db, 'quizSubmissions', `${auth.currentUser.email}_${todayDate}`);
                const submissionSnap = await getDoc(submissionRef);

                if (submissionSnap.exists()) {
                    setAlreadyTaken(true);
                    setScore(submissionSnap.data().score);
                    setLoading(false);
                    return;
                }

                // 2. Fetch today's quiz
                const quizRef = doc(db, 'quizzes', todayDate);
                const quizSnap = await getDoc(quizRef);

                if (quizSnap.exists()) {
                    setQuiz(quizSnap.data());
                } else {
                    setQuiz(null);
                }
            } catch (error) {
                console.error("Error fetching quiz:", error);
                toast.error("Failed to load today's challenge");
            } finally {
                setLoading(false);
            }
        };

        fetchQuizAndStatus();
    }, [todayDate, navigate]);

    const handleAnswerSelect = (optionIndex) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);

        // Move to next question after short delay
        setTimeout(() => {
            if (currentQuestionIndex < quiz.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 300);
    };

    const calculateResult = () => {
        let correctCount = 0;
        quiz.questions.forEach((q, index) => {
            if (userAnswers[index] === q.correctAnswer) {
                correctCount++;
            }
        });
        return correctCount;
    };

    const handleSubmitQuiz = async () => {
        if (userAnswers.length < quiz.questions.length) {
            toast.error("Please answer all questions before submitting");
            return;
        }

        const finalScore = calculateResult();
        setScore(finalScore);
        setLoading(true);

        try {
            await setDoc(doc(db, 'quizSubmissions', `${auth.currentUser.email}_${todayDate}`), {
                userId: auth.currentUser.email,
                userName: auth.currentUser.displayName || 'Anonymous User',
                quizDate: todayDate,
                score: finalScore,
                totalQuestions: quiz.questions.length,
                submittedAt: serverTimestamp()
            });
            setShowResults(true);
            toast.success("Quiz completed! Great effort.");
        } catch (error) {
            console.error("Error submitting quiz:", error);
            toast.error("Failed to save your score.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
                <Loader2 className="animate-spin text-pista-dark" size={48} />
            </div>
        );
    }

    // Already taken view
    if (alreadyTaken) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] font-sans selection:bg-pista-light">
                <Navbar />
                <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-100/50"
                    >
                        <div className="w-24 h-24 bg-pista-light/30 rounded-full flex items-center justify-center text-pista-dark mx-auto mb-8">
                            <CheckCircle size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4 italic">Submission Logged</h1>
                        <p className="text-slate-500 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
                            You have already processed today's knowledge challenge. Return tomorrow for new data.
                        </p>

                        <div className="bg-slate-50 rounded-3xl p-8 mb-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Previous Performance</p>
                            <div className="text-5xl font-black text-slate-900 italic">
                                {score} <span className="text-slate-300 not-italic uppercase text-xl">PTS</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                        >
                            <HomeIcon size={18} />
                            <span>Return to Base</span>
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // No quiz today
    if (!quiz) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] font-sans">
                <Navbar />
                <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-8">
                        <Zap size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-3 italic">Vault System Offline</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No performance assessment scheduled for today.</p>
                </div>
            </div>
        );
    }

    // Quiz taking view
    if (!showResults) {
        const currentQ = quiz.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

        return (
            <div className="min-h-screen bg-[#FDFCF9] font-sans selection:bg-pista-light">
                <Navbar />

                <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
                    {/* Header Progress */}
                    <div className="mb-12 space-y-4">
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="h-1.5 w-6 bg-pista-dark rounded-full" />
                                    <span className="text-[10px] font-black text-pista-dark uppercase tracking-widest">Active Assessment</span>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 italic">{quiz.title}</h1>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-slate-900 italic">{currentQuestionIndex + 1}</span>
                                <span className="text-slate-300 font-bold ml-1 uppercase text-[10px] tracking-widest">/ {quiz.questions.length}</span>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                className="h-full bg-pista-dark"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* Question Card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="space-y-10"
                        >
                            <div className="bg-white p-6 sm:p-10 lg:p-14 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 scale-150">
                                    <Award size={160} />
                                </div>
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-800 leading-relaxed mb-8 sm:mb-12 relative z-10 italic">
                                    {currentQ.question}
                                </h2>

                                <div className="grid grid-cols-1 gap-3 sm:gap-4 relative z-10">
                                    {currentQ.options.map((option, idx) => {
                                        const isSelected = userAnswers[currentQuestionIndex] === idx;
                                        return (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleAnswerSelect(idx)}
                                                className={`
                                                    w-full px-5 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-left border-2 transition-all duration-300 font-bold text-xs sm:text-sm
                                                    ${isSelected
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                                                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-pista-light'}
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 sm:gap-6">
                                                        <span className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black italic ${isSelected ? 'bg-pista-dark text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </span>
                                                        <span className="flex-1">{option}</span>
                                                    </div>
                                                    {isSelected && <CheckCircle size={20} />}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center px-4">
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 disabled:opacity-30 transition-colors"
                                >
                                    Previous Node
                                </button>

                                {currentQuestionIndex === quiz.questions.length - 1 ? (
                                    <button
                                        onClick={handleSubmitQuiz}
                                        disabled={userAnswers.length < quiz.questions.length}
                                        className="px-10 py-4 bg-pista-dark text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-pista-deep transition-all shadow-xl shadow-pista-light disabled:opacity-50"
                                    >
                                        Commit Submission
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                        disabled={userAnswers[currentQuestionIndex] === undefined}
                                        className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:translate-x-1 transition-all disabled:opacity-30"
                                    >
                                        Next Node
                                        <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // Results view
    return (
        <div className="min-h-screen bg-[#FDFCF9] font-sans">
            <Navbar />
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 lg:p-20 border border-slate-100 shadow-2xl text-center"
                >
                    <div className="inline-flex p-4 rounded-3xl bg-pista-light/20 text-pista-dark mb-10">
                        <Award size={48} />
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 mb-4 italic">Assessment Complete</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Intelligence Harvested Successfully</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-4">
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-pista-light transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Nodes</p>
                            <p className="text-4xl font-black text-slate-800 italic">{quiz.questions.length}</p>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl -rotate-2">
                            <p className="text-[10px] font-black text-pista-dark uppercase tracking-widest mb-4">Final Score</p>
                            <p className="text-4xl font-black text-white italic">{score} <span className="text-pista-dark text-lg not-italic">PTS</span></p>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-pista-light transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Accuracy</p>
                            <p className="text-4xl font-black text-slate-800 italic">{Math.round((score / quiz.questions.length) * 100)}%</p>
                        </div>
                    </div>

                    <div className="max-w-md mx-auto space-y-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                        >
                            Archive & Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DailyQuiz;
