import React from 'react';
import {
    Plus,
    Upload,
    Search,
    BookOpen,
    ArrowRight,
    Flame,
    Zap
} from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Topic } from '../App';
import { ActivityGraph } from './ActivityGraph';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { QuickUploadModal } from './QuickUploadModal';

interface DashboardProps {
    topics: Topic[];
    onSelectTopic: (id: string) => void;
    userRole: 'teacher' | 'student';
    onJoinClass: (code: string) => boolean;
    onUploadComplete: (topicId: string, pdfUrl: string) => void;
    onNavigateToCreateClass?: () => void;
    onOpenReviewModal?: () => void;
    isClassroomsView?: boolean;
    onJoinClassClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    topics,
    onSelectTopic,
    userRole,
    onJoinClass,
    onUploadComplete,
    onNavigateToCreateClass,
    onOpenReviewModal,
    isClassroomsView = false,
    onJoinClassClick
}) => {
    const isTeacher = userRole === 'teacher';
    const { streak, weeklyLogs } = useActivityTracker();
    const [joinCode, setJoinCode] = React.useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingTopicId, setUploadingTopicId] = React.useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Determine if we should show the sidebar for students
    const showSidebar = isTeacher || (!isClassroomsView);

    const getWelcomeMessage = () => {
        if (isTeacher) return "Here is what's happening with your classes today.";
        if (streak <= 3) return "Welcome back! Let's get going and make some progress today.";
        return "Welcome back! Good going, keep it up!";
    };

    const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!isTeacher && topics.length > 0) {
            // Check status for the first active topic (or iterate if needed)
            // For now, checking the first enrolled topic as a demo
            const checkStatus = async () => {
                try {
                    const response = await fetch(`http://localhost:8000/api/progress/${topics[0].id}`);
                    const data = await response.json();
                    if (data.status === 'lagging') {
                        setAlertMessage(data.deadline_message);
                    }
                } catch (e) {
                    console.error("Failed to check status", e);
                }
            };
            checkStatus();
        }
    }, [topics, isTeacher]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingTopicId) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            toast.loading('Processing document...', { id: 'upload' });
            const response = await fetch(`http://localhost:8000/upload?session_id=${uploadingTopicId}`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                toast.success('Material uploaded and indexed!', { id: 'upload' });
                onUploadComplete(uploadingTopicId, file.name);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast.error('Failed to process document', { id: 'upload' });
        } finally {
            setUploadingTopicId(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileUpload}
            />

            <QuickUploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                topics={topics}
                onUploadComplete={onUploadComplete}
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black">
                            {isClassroomsView ? 'Your Classrooms' : `Welcome back, ${isTeacher ? 'Professor' : 'Student'}!`}
                        </h2>
                        {!isTeacher && !isClassroomsView && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full border border-orange-500/20 text-xs font-black uppercase tracking-widest animate-pulse">
                                <Flame size={14} fill="currentColor" /> {streak} Day Streak
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground font-medium">
                        {isClassroomsView ? 'Manage and access all your enrolled classes.' : getWelcomeMessage()}
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64 transition-all focus:md:w-80"
                    />
                </div>
            </header>

            {alertMessage && !isClassroomsView && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 animate-pulse">
                    <Flame size={20} fill="currentColor" />
                    <span className="font-bold">{alertMessage}</span>
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={`${showSidebar ? 'md:col-span-2' : 'md:col-span-3'} space-y-6`}>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-xl font-bold">{isClassroomsView ? 'All Classrooms' : 'Recent Topics'}</h3>
                        {!isClassroomsView ? (
                            <button className="text-primary text-sm font-black uppercase tracking-widest hover:underline">View all</button>
                        ) : (
                            !isTeacher && (
                                <button
                                    onClick={onJoinClassClick}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-lg shadow-primary/20"
                                >
                                    <Plus size={18} /> Join New Class
                                </button>
                            )
                        )}
                    </div>

                    {topics.length > 0 ? (
                        <div className={`grid grid-cols-1 ${showSidebar ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-6`}>
                            {topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    onClick={() => onSelectTopic(topic.id)}
                                    className="group p-6 bg-card border border-border rounded-3xl hover:border-primary transition-all cursor-pointer hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full"
                                >
                                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                        <BookOpen size={28} />
                                    </div>
                                    <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                                        {topic.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-medium">
                                        {topic.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {topic.pdfUrl && (
                                            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase rounded-lg">
                                                Material Ready
                                            </span>
                                        )}
                                        {topic.enrollmentCode && isTeacher && (
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg">
                                                Code: {topic.enrollmentCode}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-primary text-sm font-black gap-2 mt-auto group-hover:translate-x-1 transition-transform uppercase tracking-widest">
                                        {isClassroomsView ? 'Enter Classroom' : 'Continue Learning'} <ArrowRight size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                <BookOpen size={32} />
                            </div>
                            <div>
                                <p className="font-bold text-lg">No classes found</p>
                                <p className="text-sm text-muted-foreground">
                                    {isTeacher ? "Create your first class to get started!" : "Join a class using an enrollment code."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {showSidebar && (
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold">{isTeacher ? 'Quick Access' : 'Enrollment & Stats'}</h3>
                        <div className="space-y-6">
                            {!isTeacher && <ActivityGraph logs={weeklyLogs} />}

                            {isTeacher ? (
                                <div className="p-6 bg-card border border-border rounded-3xl shadow-xl shadow-primary/5 space-y-4">
                                    <h4 className="font-black text-lg">Teacher Actions</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={onNavigateToCreateClass}
                                            className="w-full p-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Plus size={20} /> Create New Class
                                        </button>
                                        <button
                                            onClick={onOpenReviewModal}
                                            className="w-full p-4 bg-secondary text-secondary-foreground border border-border rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Zap size={20} className="text-primary" /> Send Review to AI
                                        </button>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-lg">Quick Upload</h4>
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-[1.05] active:scale-[0.95] transition-all"
                                            >
                                                Open Portal
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">Add materials to your existing classes</p>
                                        <div className="space-y-3">
                                            {topics.slice(0, 3).map(topic => (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => {
                                                        setUploadingTopicId(topic.id);
                                                        fileInputRef.current?.click();
                                                    }}
                                                    className="w-full p-3 bg-secondary/50 hover:bg-primary/10 border border-transparent hover:border-primary rounded-xl transition-all flex items-center justify-between group"
                                                >
                                                    <span className="text-sm font-bold group-hover:text-primary">{topic.title}</span>
                                                    <Upload size={16} className="text-muted-foreground group-hover:text-primary" />
                                                </button>
                                            ))}
                                            {topics.length > 3 && (
                                                <button
                                                    onClick={() => setIsModalOpen(true)}
                                                    className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    + {topics.length - 3} more classes
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-card border border-border rounded-3xl shadow-xl shadow-primary/5 space-y-4">
                                    <h4 className="font-black text-lg">Join New Class</h4>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Enter 5-digit code"
                                            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-black uppercase tracking-widest text-center"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            maxLength={5}
                                        />
                                        <button
                                            onClick={() => {
                                                const success = onJoinClass(joinCode);
                                                if (success) {
                                                    toast.success("Succesfully joined the class!");
                                                    setJoinCode('');
                                                } else {
                                                    toast.error("Invalid enrollment code");
                                                }
                                            }}
                                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
