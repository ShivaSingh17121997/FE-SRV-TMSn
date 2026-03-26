'use client';

import { useParams } from 'next/navigation';
import { useTeacher } from '@/lib/hooks/useTeachers';
import { useStudents } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { usePayments } from '@/lib/hooks/usePayments';
import { useReports } from '@/lib/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Mail, Phone, BookOpen, GraduationCap, Users, DollarSign, TrendingUp, Video, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function TeacherDetailsPage() {
    const { id } = useParams();
    const teacherId = typeof id === 'string' ? id : '';

    const { data: teacher, isLoading: loadingTeacher, isError: teacherError } = useTeacher(teacherId);
    const { data: studentsData, isLoading: loadingStudents } = useStudents({ teacherId, limit: '100' });
    const { data: classesData, isLoading: loadingClasses } = useClasses({ teacherId, limit: 100 });
    const { data: paymentsData, isLoading: loadingPayments } = usePayments({ teacherId, limit: 100 });
    const { data: reportsData, isLoading: loadingReports } = useReports({ teacherId, limit: 100 });

    if (loadingTeacher) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    if (teacherError || !teacher) return (
        <div className="text-center py-20 text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Teacher not found or error loading data</p>
            <Link href="/teachers"><Button variant="outline" className="mt-4">Back to Teachers</Button></Link>
        </div>
    );

    const students = studentsData?.students ?? [];
    const classes = classesData?.classes ?? [];
    const payments = paymentsData?.payments ?? [];
    const reports = (reportsData as any)?.reports ?? [];

    const totalEarned = classes
        .filter(c => c.status === 'completed')
        .reduce((s, c) => s + (c.amount || 0), 0);

    const completedClasses = classes.filter(c => c.status === 'completed');

    const stats = [
        { label: 'Students', value: students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Classes Done', value: completedClasses.length, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { label: 'Reports', value: reports.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    ];

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            scheduled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            ongoing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        };
        return map[status] ?? 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/teachers">
                        <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{teacher.name}</h1>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Teacher Profile</p>
                    </div>
                </div>
                {teacher.googleMeetLink && (
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20 rounded-xl px-6 h-10 transition-all"
                        onClick={() => window.open(teacher.googleMeetLink?.startsWith('http') ? teacher.googleMeetLink : `https://${teacher.googleMeetLink}`, '_blank')}
                    >
                        <Video className="w-4 h-4" />
                        Join Class / Meet
                    </Button>
                )}
            </div>

            {/* Profile card */}
            <Card className="shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 self-center">
                            {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    <span style={{ color: 'var(--foreground)' }}>{teacher.email}</span>
                                </div>
                                {teacher.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-blue-500" />
                                        <span style={{ color: 'var(--foreground)' }}>{teacher.phone}</span>
                                    </div>
                                )}
                                {teacher.city && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        <span style={{ color: 'var(--foreground)' }}>{teacher.city}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                {teacher.qualification && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <GraduationCap className="w-4 h-4 text-blue-500" />
                                        <span style={{ color: 'var(--foreground)' }}>{teacher.qualification}</span>
                                    </div>
                                )}
                                {teacher.experience !== undefined && (
                                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Experience: <span className="font-medium" style={{ color: 'var(--foreground)' }}>{teacher.experience} years</span></p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {teacher.subjects?.map((s) => (
                                        <Badge key={s} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {teacher.bio && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{teacher.bio}</p>
                        </div>
                    )}
                    {teacher.googleMeetLink && (
                        <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2 text-sm">
                                <Video className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium" style={{ color: 'var(--foreground)' }}>Static Google Meet Link:</span>
                                <span className="text-emerald-700 dark:text-emerald-400 break-all">{teacher.googleMeetLink}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                                <div>
                                    <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{s.value}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl">
                    <TabsTrigger value="students" className="rounded-xl px-6">Students ({students.length})</TabsTrigger>
                    <TabsTrigger value="classes" className="rounded-xl px-6">Classes ({classes.length})</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-xl px-6">Reports ({reports.length})</TabsTrigger>
                    <TabsTrigger value="performance" className="rounded-xl px-6">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.length === 0 ? (
                            <p className="col-span-full text-center py-12 text-muted-foreground bg-accent/20 rounded-2xl border border-dashed">No students assigned to this teacher.</p>
                        ) : (
                            students.map((student) => (
                                <Card key={student._id} className="shadow-sm border transition-all hover:shadow-md" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate text-foreground">{student.name}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{student.class} · {student.subject}</p>
                                        </div>
                                        <Badge className={`text-[10px] h-5 px-1.5 uppercase tracking-wide font-bold border-0 ${statusBadge(student.status)}`}>{student.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="classes" className="mt-6">
                    <Card className="shadow-sm border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            {['Student', 'Topic', 'Date', 'Amount', 'Status'].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <TableBody>
                                        {classes.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-20 text-muted-foreground bg-accent/5">No class history found</td></tr>
                                        ) : (
                                            classes.map((c, i) => (
                                                <TableRow key={c._id} className="hover:bg-muted/30 transition-colors border-b last:border-0 border-border/40">
                                                    <TableCell className="px-4 py-3 font-semibold text-foreground">
                                                        {c.studentId && typeof c.studentId === 'object' ? c.studentId.name : 'Unknown'}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-foreground">{c.topic}</TableCell>
                                                    <TableCell className="px-4 py-3 text-muted-foreground">{format(new Date(c.date), 'dd MMM yyyy')}</TableCell>
                                                    <TableCell className="px-4 py-3 font-bold text-emerald-600">₹{c.amount}</TableCell>
                                                    <TableCell className="px-4 py-3"><Badge className={`text-[10px] border-0 h-5 px-1.5 font-bold ${statusBadge(c.status)}`}>{c.status}</Badge></TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="mt-6">
                    <div className="space-y-4">
                        {reports.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground bg-accent/20 rounded-2xl border border-dashed">
                                <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p>No progress reports submitted yet.</p>
                            </div>
                        ) : (
                            reports.map((report: any) => (
                                <Card key={report._id} className="shadow-sm border border-border/50">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{report.studentId?.name || 'Unknown Student'}</p>
                                                <p className="text-[11px] text-muted-foreground">{format(new Date(report.date), 'EEEE, MMMM do')}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">{report.subject}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div className="p-2 rounded-xl bg-muted/30">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Topic Covered</p>
                                                <p className="text-xs text-foreground line-clamp-2">{report.topicCovered}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-muted/30">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Homework</p>
                                                <p className="text-xs text-foreground line-clamp-2">{report.homeworkGiven}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Avg Class Rate', value: completedClasses.length > 0 ? `₹${Math.round(classes.reduce((s, c) => s + (c.amount || 0), 0) / (classes.length || 1))}` : 'N/A', icon: DollarSign },
                            { label: 'Avg Duration', value: completedClasses.length > 0 ? `${Math.round(classes.reduce((s, c) => s + (c.duration || 0), 0) / (classes.length || 1))} min` : 'N/A', icon: BookOpen },
                            { label: 'Engagement', value: reports.length > 0 ? `${Math.round((reports.length / (classes.length || 1)) * 100)}%` : '0%', icon: TrendingUp },
                            { label: 'Success Rate', value: classes.length > 0 ? `${Math.round((completedClasses.length / classes.length) * 100)}%` : '0%', icon: GraduationCap },
                        ].map((m) => (
                            <Card key={m.label} className="shadow-sm border hover:border-blue-200 transition-colors" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mb-3">
                                        <m.icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                                    <p className="text-2xl font-black mt-1 text-foreground">{m.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
