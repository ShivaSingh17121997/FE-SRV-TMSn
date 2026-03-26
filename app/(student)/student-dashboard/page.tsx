'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useClasses } from '@/lib/hooks/useClasses';
import { usePayments } from '@/lib/hooks/usePayments';
import { useReports } from '@/lib/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, DollarSign, CalendarClock, TrendingUp, Loader2, ArrowUpRight, Video } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ApiClass } from '@/lib/hooks/useClasses';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { useChangeStudentPassword } from '@/lib/hooks/useStudents';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const now = new Date();

    const { data: classesData, isLoading: loadingClasses } = useClasses();
    const { data: paymentsData, isLoading: loadingPayments } = usePayments();
    const { data: reportsData } = useReports();
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const changePassword = useChangeStudentPassword();

    const isLoading = loadingClasses || loadingPayments;

    const handleJoinClass = async (classId: string, meetLink: string) => {
        try {
            setJoiningId(classId);
            await apiPost('/classes/join', { classId });
            const link = meetLink.startsWith('http') ? meetLink : `https://${meetLink}`;
            window.open(link, '_blank');
        } catch (error: any) {
            toast.error(error.message || 'Failed to join class');
        } finally {
            setJoiningId(null);
        }
    };

    const mySessions = classesData?.classes ?? [];
    const myPayments = paymentsData?.payments ?? [];
    const myReports = reportsData?.reports ?? [];

    const upcomingClasses = mySessions
        .filter((c) => c.status === 'scheduled' || c.status === 'rescheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const completedClasses = mySessions.filter((c) => c.status === 'completed');

    // Calculate total dues or paid
    const pendingPayments = myPayments.filter(p => p.status === 'pending' || p.status === 'overdue');
    const totalDue = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const latestReport = [...myReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const stats = [
        {
            title: 'Upcoming Classes',
            value: upcomingClasses.length,
            icon: CalendarClock,
            trend: 'Check your schedule',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            title: 'Classes Completed',
            value: completedClasses.length,
            icon: BookOpen,
            trend: 'Keep up the good work!',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Pending Dues',
            value: totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')}` : 'All caught up!',
            icon: DollarSign,
            trend: totalDue > 0 ? `${pendingPayments.length} unpaid invoices` : 'No pending payments',
            bg: totalDue > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-900/20',
            iconBg: totalDue > 0 ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-gray-200 dark:bg-gray-800/40',
            iconColor: totalDue > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400',
        },
        {
            title: 'Latest Rating',
            value: latestReport ? `${latestReport.understandingLevel} / 5` : 'N/A',
            icon: TrendingUp,
            trend: latestReport?.subject || 'No reports yet',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        {format(now, 'EEEE, MMMM d, yyyy')} · Here is your learning overview
                    </p>
                </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="bg-card hover:bg-muted font-medium text-xs px-4 h-10 rounded-xl"
                        >
                            Change Password
                        </Button>
                        {upcomingClasses.length > 0 && upcomingClasses[0].teacherId && typeof upcomingClasses[0].teacherId === 'object' && upcomingClasses[0].teacherId.googleMeetLink && (
                            <Button
                                disabled={joiningId === upcomingClasses[0]._id}
                                onClick={() => handleJoinClass(upcomingClasses[0]._id, (upcomingClasses[0].teacherId as any).googleMeetLink)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20 rounded-xl px-6 h-10 inline-flex items-center justify-center font-medium text-sm transition-all"
                            >
                                {joiningId === upcomingClasses[0]._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                                Join Your Meet
                            </Button>
                        )}
                    </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={i}
                            className={`border-0 shadow-sm ${stat.bg} transition-all hover:shadow-md hover:-translate-y-0.5`}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                                            <TrendingUp className="w-3 h-3 opacity-70" />
                                            {stat.trend}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming classes */}
                <Card className="shadow-sm bg-card border border-border">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Your Next Classes</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">Quickly access your upcoming sessions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {upcomingClasses.length > 0 && upcomingClasses[0].teacherId && typeof upcomingClasses[0].teacherId === 'object' && upcomingClasses[0].teacherId.googleMeetLink && (
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    disabled={joiningId === upcomingClasses[0]._id}
                                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 gap-1.5 h-8 px-3 text-xs"
                                    onClick={() => handleJoinClass(upcomingClasses[0]._id, (upcomingClasses[0].teacherId as any).googleMeetLink)}
                                >
                                    {joiningId === upcomingClasses[0]._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} 
                                    Join Your Class
                                </Button>
                            )}
                            <Link href="/student-schedule" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                                Full Schedule <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingClasses.length === 0 ? (
                                <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>You have no scheduled classes coming up.</p>
                            ) : (
                                upcomingClasses.slice(0, 4).map((c) => (
                                    <div
                                        key={c._id}
                                        className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors bg-muted/20"
                                    >
                                        <div className="flex-shrink-0 text-center bg-background rounded-lg p-2 border shadow-sm">
                                            <p className="text-sm font-bold text-emerald-600">{format(new Date(c.date), 'MMM')}</p>
                                            <p className="text-2xl font-black text-foreground">{new Date(c.date).getDate()}</p>
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{c.topic}</p>
                                            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                                {c.subject} · {c.time}
                                            </p>
                                            <Badge variant="outline" className="mt-2 text-xs text-muted-foreground">
                                                {c.duration} mins
                                            </Badge>
                                        </div>
                                        {c.teacherId && typeof c.teacherId === 'object' && c.teacherId.googleMeetLink && (
                                            <div className="flex-shrink-0 self-center">
                                                <Button
                                                    disabled={joiningId === c._id}
                                                    onClick={() => handleJoinClass(c._id, (c.teacherId as any).googleMeetLink)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-lg h-9 px-4 inline-flex items-center justify-center font-medium text-xs transition-all"
                                                >
                                                    {joiningId === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                                                    Join Meet
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Latest Report / Notes */}
                <Card className="shadow-sm bg-card border border-border">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">Latest Progress Report</CardTitle>
                        <Link href="/student-reports" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                            All Reports <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {!latestReport ? (
                                <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No progress reports available yet.</p>
                            ) : (
                                <div className="p-5 rounded-xl border border-border bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-200">{latestReport.subject}</h3>
                                            <p className="text-sm text-indigo-700 dark:text-indigo-400">{format(new Date(latestReport.date), 'MMMM d, yyyy')}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white dark:bg-black/40 px-3 py-1.5 rounded-full shadow-sm">
                                            <span className="text-amber-500 font-bold">★</span>
                                            <span className="font-bold text-sm">{latestReport.understandingLevel}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1">Topic Covered</p>
                                            <p className="text-sm text-foreground">{latestReport.topicCovered}</p>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1">Homework</p>
                                            <p className="text-sm text-foreground">{latestReport.homeworkGiven || 'None assigned'}</p>
                                        </div>
                                        {latestReport.remarks && (
                                            <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                                <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1">Teacher Remarks</p>
                                                <p className="text-sm text-foreground italic">"{latestReport.remarks}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Change Password Modal */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Change Your Password</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Set a new password for your portal access.
                        </p>
                    </DialogHeader>
                    <ChangePasswordForm 
                        email={user?.email || ''} 
                        onSuccess={() => setIsPasswordModalOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ChangePasswordForm({ email, onSuccess }: { email: string; onSuccess: () => void }) {
    const changePassword = useChangeStudentPassword();
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { password: '' }
    });

    const onSubmit = async (data: any) => {
        if (!email) return;
        try {
            await changePassword.mutateAsync({ email, password: data.password });
            toast.success('Password updated successfully');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1">
                <Label>New Password *</Label>
                <Input 
                    type="password" 
                    placeholder="Min 6 characters" 
                    {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} 
                />
                {errors.password && <p className="text-xs text-red-500">{(errors.password as any).message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={onSuccess}>Cancel</Button>
                <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={changePassword.isPending}
                >
                    {changePassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                </Button>
            </div>
        </form>
    );
}
