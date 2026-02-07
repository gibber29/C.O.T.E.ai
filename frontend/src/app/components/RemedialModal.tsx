import React, { useState } from 'react';
import { X, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RemedialModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: any;
    cooldownRemaining: number;
}

export const RemedialModal: React.FC<RemedialModalProps> = ({ isOpen, onClose, plan, cooldownRemaining }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    if (!isOpen || !plan) return null;

    const handleCheck = () => {
        if (!selectedOption || !plan.practice_question) return;
        setIsCorrect(selectedOption === plan.practice_question.correct_answer);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border shadow-2xl overflow-y-auto"
            >
                <div className="p-6 border-b border-border flex items-center justify-between bg-red-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Diagnostic Report</h2>
                            <p className="text-xs text-red-500 font-mono font-bold">
                                RETRY LOCKED: {formatTime(cooldownRemaining)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* DIAGNOSIS */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Analysis</h3>
                        <div className="p-4 rounded-xl border-l-4 border-yellow-500 bg-yellow-500/5">
                            <h4 className="font-bold text-lg mb-1">{plan.diagnosis}</h4>
                            <p className="text-muted-foreground">{plan.explanation}</p>
                        </div>
                    </div>

                    {/* PRACTICE */}
                    {plan.practice_question && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Remedial Practice</h3>
                            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                                <p className="font-semibold text-lg mb-6">{plan.practice_question.question}</p>

                                <div className="space-y-3">
                                    {plan.practice_question.options.map((opt: string) => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                if (isCorrect !== true) {
                                                    setSelectedOption(opt);
                                                    setIsCorrect(null);
                                                }
                                            }}
                                            className={`w-full text-left p-4 rounded-xl border transition-all font-medium flex items-center justify-between
                                                ${selectedOption === opt
                                                    ? (isCorrect === true ? 'bg-green-500/10 border-green-500 text-green-600'
                                                        : isCorrect === false ? 'bg-red-500/10 border-red-500 text-red-600'
                                                            : 'bg-primary/10 border-primary text-primary')
                                                    : 'hover:bg-accent border-border'
                                                }`}
                                        >
                                            {opt}
                                            {selectedOption === opt && isCorrect === true && <CheckCircle size={18} />}
                                            {selectedOption === opt && isCorrect === false && <AlertTriangle size={18} />}
                                        </button>
                                    ))}
                                </div>

                                {selectedOption && isCorrect === null && (
                                    <button
                                        onClick={handleCheck}
                                        className="mt-6 w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl"
                                    >
                                        Check Answer
                                    </button>
                                )}

                                {isCorrect === true && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-4 bg-green-500/10 text-green-600 rounded-xl"
                                    >
                                        <strong>Excellent!</strong> {plan.practice_question.explanation}
                                    </motion.div>
                                )}

                                {isCorrect === false && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-4 bg-red-500/10 text-red-600 rounded-xl"
                                    >
                                        <strong>Not quite.</strong> Try again!
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
