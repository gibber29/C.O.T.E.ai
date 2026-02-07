import React from 'react';
import {
    LayoutDashboard,
    Library,
    ClipboardList,
    TrendingUp,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Zap
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: 'teacher' | 'student';
    onLogout: () => void;
    onOpenReviewModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    userRole,
    onLogout,
    onOpenReviewModal
}) => {
    const isTeacher = userRole === 'teacher';

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'materials', label: 'Classrooms', icon: Library },
        { id: 'assessments', label: 'Assessments', icon: ClipboardList },
        { id: 'progress', label: 'Student Progress', icon: TrendingUp },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 bottom-0 z-40 bg-card border-r border-border transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} flex flex-col`}
        >
            <div className="h-16 flex items-center justify-between px-4">
                {isOpen && <span className="text-xl font-black text-primary">C.O.T.E.ai</span>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors ml-auto"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === item.id
                            ? 'bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20'
                            : 'hover:bg-accent text-foreground/70 hover:text-foreground'
                            }`}
                    >
                        <item.icon size={22} />
                        {isOpen && <span>{item.label}</span>}
                    </button>
                ))}

                {isTeacher && (
                    <div className="pt-4 mt-4 border-t border-border">
                        <button
                            onClick={onOpenReviewModal}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary hover:bg-primary/10 transition-all group"
                        >
                            <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <Zap size={18} className="text-primary group-hover:text-primary-foreground" />
                            </div>
                            {isOpen && <span className="font-bold">Send Review to AI</span>}
                        </button>
                    </div>
                )}
            </nav>

            <div className="p-2 border-t border-border">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                >
                    <LogOut size={22} />
                    {isOpen && <span className="font-semibold">Logout</span>}
                </button>
            </div>
        </aside>
    );
};
