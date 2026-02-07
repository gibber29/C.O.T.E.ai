import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherAssessmentPreviewProps {
    sessionId: string;
    onBack: () => void;
}

interface Question {
    id: number;
    question: string;
    options?: string[];
    correct_answer?: string;
    type?: string;
    explanation?: string;
}

interface Quest {
    level: number;
    questions: Question[];
    timer_seconds: number;
}

interface Chapter {
    chapter_name: string;
    chapter_index: number;
    quests: Quest[];
}

export const TeacherAssessmentPreview: React.FC<TeacherAssessmentPreviewProps> = ({ sessionId, onBack }) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0])); // First chapter expanded by default
    const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/teacher/assessments/${sessionId}`);
                const data = await res.json();
                setChapters(data.chapters || []);
            } catch (e) {
                toast.error("Failed to load assessments");
            } finally {
                setLoading(false);
            }
        };
        fetchAssessments();
    }, [sessionId]);

    const toggleChapter = (index: number) => {
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedChapters(newExpanded);
    };

    const toggleQuest = (chapterIndex: number, level: number) => {
        const key = `${chapterIndex}-${level}`;
        const newExpanded = new Set(expandedQuests);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedQuests(newExpanded);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground font-bold">Loading assessments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background animate-in fade-in">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center gap-4 bg-card/50 backdrop-blur-sm">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-accent rounded-full transition-all hover:scale-110 active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-black">Assessment Preview</h2>
                    <p className="text-sm text-muted-foreground font-medium">Review all quest questions by chapter</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {chapters.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center">
                            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="font-bold text-lg">No assessments found</p>
                            <p className="text-sm text-muted-foreground">Upload materials to generate quests</p>
                        </div>
                    ) : (
                        chapters.map((chapter, chapterIdx) => (
                            <div key={chapterIdx} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                                {/* Chapter Header */}
                                <button
                                    onClick={() => toggleChapter(chapterIdx)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black">
                                            {chapterIdx + 1}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-lg">Section {chapterIdx + 1}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">{chapter.chapter_name}</p>
                                        </div>
                                    </div>
                                    {expandedChapters.has(chapterIdx) ? (
                                        <ChevronUp className="text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="text-muted-foreground" />
                                    )}
                                </button>

                                {/* Chapter Content */}
                                {expandedChapters.has(chapterIdx) && (
                                    <div className="border-t border-border p-6 space-y-6 bg-muted/20">
                                        {chapter.quests.map((quest) => {
                                            const questKey = `${chapterIdx}-${quest.level}`;
                                            const isQuestExpanded = expandedQuests.has(questKey);

                                            return (
                                                <div key={quest.level} className="bg-card rounded-2xl border border-border overflow-hidden">
                                                    {/* Quest Header */}
                                                    <button
                                                        onClick={() => toggleQuest(chapterIdx, quest.level)}
                                                        className="w-full p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Target className="text-primary" size={20} />
                                                            <div className="text-left">
                                                                <h4 className="font-bold">Quest {quest.level}</h4>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {quest.questions.length} questions • {Math.floor(quest.timer_seconds / 60)} min timer
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isQuestExpanded ? (
                                                            <ChevronUp size={20} className="text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown size={20} className="text-muted-foreground" />
                                                        )}
                                                    </button>

                                                    {/* Quest Questions */}
                                                    {isQuestExpanded && (
                                                        <div className="border-t border-border p-4 space-y-6 bg-secondary/30">
                                                            {quest.questions.map((q, qIdx) => (
                                                                <div key={q.id || qIdx} className="p-4 bg-card rounded-xl border border-border">
                                                                    <div className="flex gap-3">
                                                                        <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                                                                            {qIdx + 1}
                                                                        </span>
                                                                        <div className="flex-1 space-y-3">
                                                                            <p className="font-semibold">{q.question}</p>

                                                                            {q.options && q.options.length > 0 && (
                                                                                <div className="space-y-2">
                                                                                    {q.options.map((opt, optIdx) => (
                                                                                        <div
                                                                                            key={optIdx}
                                                                                            className={`p-3 rounded-lg border ${q.correct_answer === opt
                                                                                                    ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                                                                                                    : 'bg-secondary border-border'
                                                                                                }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="font-bold text-xs">
                                                                                                    {String.fromCharCode(65 + optIdx)}.
                                                                                                </span>
                                                                                                <span className="text-sm">{opt}</span>
                                                                                                {q.correct_answer === opt && (
                                                                                                    <span className="ml-auto text-xs font-black uppercase tracking-wider">
                                                                                                        ✓ Correct
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {q.type === 'short_answer' && (
                                                                                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                                                    <p className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                                                                                        Short Answer Question
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground italic">{q.explanation}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
