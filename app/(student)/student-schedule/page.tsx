'use client';

import { useState } from 'react';
import { useClasses } from '@/lib/hooks/useClasses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, BookOpen, Search, User, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/dashboard/Pagination';

export default function StudentSchedulePage() {
    const [page, setPage] = useState(1);
    const limit = 10;
    const [searchQuery, setSearchQuery] = useState('');
    const { data, isLoading } = useClasses({
        page: String(page),
        limit: String(limit),
        search: searchQuery || undefined,
        sortBy: 'date',
        sortOrder: 'asc'
    });
    const [joiningId, setJoiningId] = useState<string | null>(null);

    const filteredClasses = data?.classes ?? [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

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

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>My Schedule</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        View all your upcoming and past classes
                    </p>
                </div>
                {filteredClasses.length > 0 && filteredClasses[0].teacherId && typeof filteredClasses[0].teacherId === 'object' && filteredClasses[0].teacherId?.googleMeetLink && (
                    <Button 
                        disabled={joiningId === filteredClasses[0]._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20 rounded-xl px-6 h-10 transition-all"
                        onClick={() => handleJoinClass(filteredClasses[0]._id, (filteredClasses[0].teacherId as any).googleMeetLink)}
                    >
                        {joiningId === filteredClasses[0]._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        Join Your Class
                    </Button>
                )}
            </div>

            <Card className="shadow-sm border-0" style={{ background: 'var(--card)' }}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                    <div>
                        <CardTitle className="text-lg">Class History</CardTitle>
                        <CardDescription>A complete log of your enrolled sessions.</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                        <Input
                            placeholder="Search topics or subjects..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 border-b" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold">Teacher</th>
                                    <th className="px-6 py-4 font-semibold">Subject</th>
                                    <th className="px-6 py-4 font-semibold">Topic</th>
                                    <th className="px-6 py-4 font-semibold">Duration</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Join Class</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {filteredClasses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                                            No classes found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClasses.map((c) => {
                                        const teacherName = c.teacherId && typeof c.teacherId === 'object' && c.teacherId !== null
                                            ? c.teacherId.name
                                            : 'Teacher';

                                        return (
                                            <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                                                {/* Date & Time */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                                        <span className="font-medium">{format(new Date(c.date), 'MMM d, yyyy')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{c.time}</span>
                                                    </div>
                                                </td>

                                                {/* Teacher */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                            {teacherName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{teacherName}</p>
                                                            {c.teacherId && typeof c.teacherId === 'object' && c.teacherId !== null && (
                                                                <div className="flex flex-col">
                                                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.teacherId.email}</p>
                                                                    {c.teacherId && typeof c.teacherId === 'object' && c.teacherId !== null && c.teacherId.googleMeetLink ? (
                                                                        <button 
                                                                            onClick={() => handleJoinClass(c._id, (c.teacherId as any).googleMeetLink)}
                                                                            disabled={joiningId === c._id}
                                                                            className="text-[10px] text-emerald-600 hover:text-emerald-500 font-medium flex items-center gap-1 mt-1 group disabled:opacity-50"
                                                                        >
                                                                            {joiningId === c._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
                                                                            <span>Join Class</span>
                                                                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[10px] text-amber-600 italic mt-1 font-medium">Link not set</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Subject */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-emerald-600 opacity-70" />
                                                        <span className="font-medium">{c.subject}</span>
                                                    </div>
                                                </td>

                                                {/* Topic */}
                                                <td className="px-6 py-4 truncate max-w-[180px]" style={{ color: 'var(--foreground)' }}>
                                                    {c.topic}
                                                </td>

                                                {/* Duration */}
                                                <td className="px-6 py-4" style={{ color: 'var(--muted-foreground)' }}>
                                                    {c.duration} mins
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 text-right">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] py-0 px-2 h-5 font-semibold capitalize border",
                                                            c.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            c.status === 'scheduled' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            c.status === 'ongoing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            c.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                            'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                        )}
                                                    >
                                                        {c.status}
                                                    </Badge>
                                                </td>

                                                {/* Join Class */}
                                                <td className="px-6 py-4 text-right">
                                                    {c.teacherId && typeof c.teacherId === 'object' && c.teacherId !== null && c.teacherId.googleMeetLink ? (
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={joiningId === c._id}
                                                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 gap-1.5"
                                                            onClick={() => handleJoinClass(c._id, (c.teacherId as any).googleMeetLink)}
                                                        >
                                                            {joiningId === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} 
                                                            Join Class
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic">Link not set</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                {data?.pagination && (
                    <div className="border-t border-border">
                        <Pagination 
                            currentPage={data.pagination.page} 
                            totalPages={data.pagination.totalPages} 
                            onPageChange={setPage} 
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
