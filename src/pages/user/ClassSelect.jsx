import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const ClassSelect = () => {
    const classes = [
        { id: '10', title: 'Class 10', subtitle: 'Board Exam Preparation', color: 'bg-pista-light' },
        { id: '11', title: 'Class 11', subtitle: 'Foundation Year', color: 'bg-pista' },
        { id: '12', title: 'Class 12', subtitle: 'Advanced Studies', color: 'bg-pista-dark' },
    ];

    return (
        <div className="min-h-screen bg-cream-light pt-28 lg:pt-36 pb-20 px-4 sm:px-8">
            <Navbar />

            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pista-deep mb-4">Choose Your Class</h1>
                    <p className="text-pista-deep/60 text-lg">Select your academic level to access specialized notes.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {classes.map((cls, idx) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Link
                                to={`/class/${cls.id}`}
                                className="group block relative bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-pista/5 border border-pista-light/20 hover:border-pista hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${cls.color} rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                    <GraduationCap size={28} />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-pista-deep mb-2">{cls.title}</h3>
                                <p className="text-pista-deep/50 mb-8 font-medium">{cls.subtitle}</p>
                                <div className="flex items-center text-pista-dark font-bold space-x-2 group-hover:translate-x-2 transition-transform">
                                    <span>Explore Subjects</span>
                                    <ChevronRight size={20} />
                                </div>

                                {/* Decorative element */}
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <GraduationCap size={80} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 p-8 bg-white/50 border border-pista-light/30 rounded-3xl text-center"
                >
                    <p className="text-pista-deep/60 italic">
                        "Education is the most powerful weapon which you can use to change the world."
                    </p>
                    <span className="block mt-2 font-bold text-pista-dark text-sm">— Nelson Mandela</span>
                </motion.div>
            </div>
        </div>
    );
};

export default ClassSelect;
