'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Users, User, BookOpen, BarChart3, Settings,
    GraduationCap, PlusCircle, TrendingUp, DollarSign, Shield, X,
    ChevronRight, LogOut, School, UserPlus, ClipboardList, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const teacherNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/students', label: 'My Students', icon: Users },
    { href: '/add-class', label: 'Add Class', icon: PlusCircle },
    { href: '/class-history', label: 'Class History', icon: BookOpen },
    { href: '/progress-reports', label: 'Progress Reports', icon: TrendingUp },
    { href: '/earnings', label: 'Earnings', icon: DollarSign },
    // { href: '/homework', label: 'Homework', icon: ClipboardList },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/teachers-onboarding', label: 'Teacher Onboarding', icon: ClipboardList },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/classes', label: 'Classes', icon: BookOpen },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    // { href: '/homework', label: 'Homework', icon: ClipboardList },
    { href: '/permissions', label: 'Permissions', icon: Shield },
    { href: '/feedbacks', label: 'Feedbacks', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
];

const superAdminNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/teachers-onboarding', label: 'Teacher Onboarding', icon: ClipboardList },
    { href: '/students', label: 'Students', icon: Users },
    { href: '/classes', label: 'Classes', icon: BookOpen },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/users', label: 'Manage Users', icon: UserPlus },
    // { href: '/homework', label: 'Homework', icon: ClipboardList },
    { href: '/permissions', label: 'Permissions', icon: Shield },
    { href: '/feedbacks', label: 'Feedbacks', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navItems = user?.role === 'teacher' ? teacherNav : user?.role === 'super_admin' ? superAdminNav : adminNav;

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const roleLabel: Record<string, string> = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        teacher: 'Teacher',
    };

    const roleBadgeColor: Record<string, string> = {
        super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        teacher: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };

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
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                            <School className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-base text-primary">SRV Learning</span>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Teacher Management System</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* User info */}
                <div className="p-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                        <Avatar className="w-10 h-10 border border-border">
                            <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                                {user ? getInitials(user.name) : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                                {user?.name ?? 'User'}
                            </p>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', user?.role ? roleBadgeColor[user.role] : '')}>
                                {user?.role ? roleLabel[user.role] : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>
                        Navigation
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    'hover:bg-accent/50 hover:text-foreground',
                                    isActive
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-muted-foreground',
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
