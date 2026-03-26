'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { usePayments } from '@/lib/hooks/usePayments';
import { useTeacher, useTeachers } from '@/lib/hooks/useTeachers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, DollarSign, CalendarClock, TrendingUp, ArrowUpRight, Loader2, Video, MoreVertical, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ApiStudent } from '@/lib/hooks/useStudents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiPost } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/dashboard/Pagination';

export default function DashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Hooks
    const [teacherPage, setTeacherPage] = useState(1);
    const { data: teacherProfile } = useTeacher(user?._id ?? user?.id ?? '');
    const { data: allTeachersData, isLoading: loadingTeachers } = useTeachers({
        limit: 5,
        page: teacherPage
    });
    const { data: studentsData, isLoading: loadingStudents } = useStudents({ limit: '1000' });
    const { data: classesData, isLoading: loadingClasses } = useClasses({ limit: 1000 });
    const { data: paymentsData, isLoading: loadingPayments } = usePayments();

    const [processingId, setProcessingId] = useState<string | null>(null);

    const isLoading = loadingStudents || loadingClasses || loadingPayments || (isAdmin && loadingTeachers);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentGoogleMeetLink = teacherProfile?.googleMeetLink || user?.googleMeetLink;

    const handleStartClass = async (classId: string, meetLink: string) => {
        try {
            setProcessingId(classId);
            await apiPost('/classes/start', { classId });
            const link = meetLink.startsWith('http') ? meetLink : `https://${meetLink}`;
            window.open(link, '_blank');
            toast.success('Class started successfully');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to start class');
        } finally {
            setProcessingId(null);
        }
    };

    const handleEndClass = async (classId: string) => {
        try {
            setProcessingId(classId);
            await apiPost('/classes/end', { classId });
            toast.success('Class ended successfully');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to end class');
        } finally {
            setProcessingId(null);
        }
    };

    const handleJoinClass = async (classId: string, meetLink: string) => {
        try {
            setProcessingId(classId);
            await apiPost('/classes/join', { classId });
            const link = meetLink.startsWith('http') ? meetLink : `https://${meetLink}`;
            window.open(link, '_blank');
            toast.success('Joined class successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to join class');
        } finally {
            setProcessingId(null);
        }
    };

    const allTeachers = allTeachersData?.teachers ?? [];
    const allStudents = studentsData?.students ?? [];
    const allSessions = classesData?.classes ?? [];

    // Filter for current view
    const myStudents = isAdmin ? allStudents : allStudents.filter(s =>
        typeof s.teacherId === 'object' ? s.teacherId._id === user?._id : s.teacherId === user?._id
    );
    const mySessions = isAdmin ? allSessions : allSessions.filter(c =>
        typeof c.teacherId === 'object' ? c.teacherId._id === user?._id : c.teacherId === user?._id
    );

    const classesThisMonth = mySessions.filter((c) => {
        const d = new Date(c.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalEarnings = mySessions
        .filter((c) => c.status === 'completed')
        .reduce((sum, c) => sum + (c.amount || 0), 0);

    const upcomingClasses = mySessions
        .filter((c) => c.status === 'scheduled' || c.status === 'ongoing')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const stats = [
        {
            title: isAdmin ? 'Total Teachers' : 'Total Students',
            value: isAdmin ? (allTeachersData?.pagination?.total ?? 0) : (studentsData?.pagination?.total ?? 0),
            icon: isAdmin ? ExternalLink : Users,
            color: 'blue',
            trend: isAdmin ? 'Staff members' : 'Active enrollment',
            borderColor: 'border-blue-500',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Classes This Month',
            value: classesThisMonth.length,
            icon: BookOpen,
            color: 'indigo',
            trend: `${classesData?.pagination?.total ?? 0} completed total`,
            borderColor: 'border-indigo-500',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            title: isAdmin ? 'Platform Revenue' : 'Total Earnings',
            value: `₹${totalEarnings.toLocaleString('en-IN')}`,
            icon: DollarSign,
            color: 'emerald',
            trend: 'From completed classes',
            borderColor: 'border-emerald-500',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            title: 'Upcoming Classes',
            value: upcomingClasses.length,
            icon: CalendarClock,
            color: 'orange',
            trend: 'Scheduled ahead',
            borderColor: 'border-orange-500',
            iconColor: 'text-orange-600 dark:text-orange-400',
        },
    ];

    const recentSessions = [...mySessions]
        .filter((c) => c.status === 'completed' || c.status === 'ongoing')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const getStudentName = (studentField: any) => {
        if (!studentField) return 'Unknown';
        if (typeof studentField === 'object') return studentField.name;
        return allStudents.find((s) => s._id === studentField)?.name ?? 'Unknown';
    };

    // Calculate teacher specific stats for Admin table
    const teachersList = allTeachers.map(t => {
        const teacherStudents = allStudents.filter(s =>
            typeof s.teacherId === 'object' ? s.teacherId._id === t._id : s.teacherId === t._id
        );
        const teacherClasses = allSessions.filter(c =>
            typeof c.teacherId === 'object' ? c.teacherId._id === t._id : c.teacherId === t._id
        );
        const teacherEarned = teacherClasses
            .filter(c => c.status === 'completed')
            .reduce((sum, c) => sum + (c.amount || 0), 0);

        return {
            ...t,
            studentCount: teacherStudents.length,
            classCount: teacherClasses.length,
            totalEarned: teacherEarned
        };
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        {isAdmin ? 'System Administration' : `Welcome back, ${user?.name?.split(' ')[0]} 👋`}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        {isAdmin ? 'Platform overview and analytics' : `${format(now, 'EEEE, MMMM d, yyyy')} · Here's what's happening today`}
                    </p>
                </div>
                {user?.role === 'teacher' && currentGoogleMeetLink && (
                    <a
                        href={currentGoogleMeetLink.startsWith('http') ? currentGoogleMeetLink : `https://${currentGoogleMeetLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl px-6 h-10 inline-flex items-center justify-center font-medium text-sm transition-all"
                    >
                        <Video className="w-4 h-4" />
                        Join Your Meet
                    </a>
                )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="shadow-sm bg-card transition-all hover:shadow-md hover:-translate-y-0.5">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold mt-1 tracking-tight text-foreground">
                                            {stat.value}
                                        </p>
                                        <div className="text-xs mt-3 flex items-center gap-1 font-medium text-muted-foreground">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                            {stat.trend}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-muted/30 dark:bg-muted/10">
                                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {isAdmin ? (
                /* Admin Teachers Table */
                <Card className="shadow-sm bg-card border">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border">
                        <CardTitle className="text-base font-semibold">Teachers Performance Overview</CardTitle>
                        <Link href="/teachers" className="text-sm text-blue-600 hover:underline">View All Staff</Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="w-full text-sm">
                                <TableHeader>
                                    <TableRow className="bg-muted/80 hover:bg-muted/80 border-b border-border">
                                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Teacher</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Students</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Classes</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Total Earned</TableHead>
                                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachersList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <p className="text-sm text-muted-foreground">No teachers registered yet.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        teachersList.map((teacher) => (
                                            <TableRow key={teacher._id} className="border-b border-border/40 hover:bg-accent/50 transition-colors">
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs uppercase">
                                                                {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <Link href={`/teachers/${teacher._id}`} className="font-semibold text-sm hover:text-blue-600 transition-colors">
                                                                {teacher.name}
                                                            </Link>
                                                            <p className="text-[10px] text-muted-foreground">{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge variant="secondary" className="font-medium">{teacher.studentCount} Students</Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge variant="outline" className="font-medium">{teacher.classCount} Classes</Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <span className="font-bold text-emerald-600">₹{teacher.totalEarned.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right">
                                                    <Link href={`/teachers/${teacher._id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            Details
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    {allTeachersData?.pagination && (
                        <div className="border-t border-border">
                            <Pagination
                                currentPage={allTeachersData.pagination.page}
                                totalPages={allTeachersData.pagination.totalPages}
                                onPageChange={setTeacherPage}
                            />
                        </div>
                    )}
                </Card>
            ) : (
                /* Regular Teacher Dashboard Detail */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent sessions */}
                    <Card className="lg:col-span-2 shadow-sm bg-card border">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Recent Classes</CardTitle>
                                <Link href="/class-history" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    View all <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentSessions.length === 0 ? (
                                    <p className="text-sm text-center py-6 text-muted-foreground">No recent class activity</p>
                                ) : (
                                    recentSessions.map((session) => (
                                        <div key={session._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate text-foreground">{session.topic}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {getStudentName(session.studentId)} · {session.subject}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-semibold text-emerald-600">₹{session.amount}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(session.date), 'dd MMM')}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming classes */}
                    <Card className="shadow-sm bg-card border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Upcoming Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcomingClasses.length === 0 ? (
                                    <p className="text-sm text-center py-6 text-muted-foreground">No upcoming classes</p>
                                ) : (
                                    upcomingClasses.map((c) => (
                                        <div key={c._id} className="flex items-start gap-4 p-4 rounded-xl border border-border group relative transition-all hover:bg-accent/30">
                                            <div className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                                                <p className="text-base font-bold text-primary">{new Date(c.date).getDate()}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                                                    {format(new Date(c.date), 'MMM')}
                                                </p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-semibold truncate text-foreground">{c.topic}</p>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isAdmin && (
                                                            <Link href={`/classes/${c._id}`}>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {user?.role === 'teacher' && currentGoogleMeetLink && c.status !== 'ongoing' && (
                                                            <button
                                                                disabled={processingId === c._id}
                                                                onClick={() => handleStartClass(c._id, currentGoogleMeetLink)}
                                                                className="px-3 py-1 text-[10px] font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                {processingId === c._id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start'}
                                                            </button>
                                                        )}
                                                        {user?.role === 'student' && (typeof c.teacherId === 'object' && (c.teacherId as any).googleMeetLink) && (
                                                            <button
                                                                disabled={processingId === c._id}
                                                                onClick={() => handleJoinClass(c._id, (c.teacherId as any).googleMeetLink)}
                                                                className="px-3 py-1 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                {processingId === c._id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Join'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{getStudentName(c.studentId)} · {c.time}</p>
                                                <Badge className={`mt-1 text-xs border-0 ${c.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {c.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
