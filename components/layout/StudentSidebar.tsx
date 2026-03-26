'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, BookOpen, TrendingUp, DollarSign, X,
    ChevronRight, LogOut, School, User, Key, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const studentNav = [
    { href: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student-schedule', label: 'My Schedule', icon: BookOpen },
    { href: '/student-reports', label: 'Progress Reports', icon: TrendingUp },
];

const profileNav = [
    { href: '/student-profile', label: 'My Profile', icon: User },
];

interface StudentSidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function StudentSidebar({ open, onClose }: StudentSidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed top-0 left-0 z-30 h-full w-64 flex flex-col transition-transform duration-300 ease-in-out',
                    'border-r',
                    'lg:translate-x-0 lg:static lg:z-auto',
                    open ? 'translate-x-0' : '-translate-x-full',
                )}
                style={{
                    background: 'var(--sidebar-bg)',
                    borderColor: 'var(--sidebar-border)',
                    color: 'var(--sidebar-text)',
                }}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <School className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-base text-emerald-600">Student Portal</span>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>SRV Learning</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* User info */}
                <div className="p-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--accent)' }}>
                        <Avatar className="w-10 h-10 ring-2 ring-emerald-200 dark:ring-emerald-800">
                            <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                                {user ? getInitials(user.name) : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                                {user?.name ?? 'Student'}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                Student
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>
                        Navigation
                    </p>
                    {studentNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300',
                                    isActive
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm'
                                        : '',
                                )}
                                style={!isActive ? { color: 'var(--sidebar-text)' } : {}}
                            >
                                <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                            </Link>
                        );
                    })}

                    {/* <p className="text-xs font-semibold uppercase tracking-widest px-3 py-2 pt-4" style={{ color: 'var(--muted-foreground)' }}>
                        Profile
                    </p> */}
                    {profileNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300',
                                    isActive
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm'
                                        : '',
                                )}
                                style={!isActive ? { color: 'var(--sidebar-text)' } : {}}
                            >
                                <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                            </Link>
                        );
                    })}
                </nav>

                <Separator style={{ background: 'var(--sidebar-border)' }} />

                {/* Logout */}
                <div className="p-3">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>
        </>
    );
}
