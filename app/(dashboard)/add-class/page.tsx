'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/lib/hooks/useStudents';
import { useCreateClass, useUpdateClass, useDeleteClass, useBulkCreateClasses, useClasses, useClass, type ApiClass } from '@/lib/hooks/useClasses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, CheckCircle, Loader2, Pencil, Trash2, AlertCircle, Calendar as CalendarIcon, Clock, Plus, History, ArrowRight, Search, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/dashboard/Pagination';
import { cn } from '@/lib/utils';

const classSchema = z.object({
    studentId: z.string().min(1, 'Select a student'),
    subject: z.string().min(2, 'Subject required'),
    topic: z.string().min(2, 'Topic required'),
    date: z.string().min(1, 'Date required'),
    time: z.string().min(1, 'Time required'),
    duration: z.string().min(1, 'Duration required'),
    amount: z.string().min(1, 'Amount required'),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled']),
});
type ClassForm = z.infer<typeof classSchema>;

export default function AddClassPage() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [success, setSuccess] = useState(false);
    const [editingClass, setEditingClass] = useState<ApiClass | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: studentsData } = useStudents({ teacherId: user?._id });
    const { data: classesData, isLoading: classesLoading } = useClasses({ 
        teacherId: user?._id,
        page: String(page),
        limit: String(limit),
    });
    const { data: classToEdit, isLoading: loadingToEdit } = useClass(editId || '');

    const createClass = useCreateClass();
    const bulkCreateClasses = useBulkCreateClasses();
    const deleteClass = useDeleteClass();

    const students = studentsData?.students ?? [];
    const allClasses = classesData?.classes ?? [];

    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<ClassForm>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            studentId: '',
            subject: '',
            topic: '',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            duration: '60',
            amount: '',
            status: 'completed',
        },
    });

    const watchedStudentId = watch('studentId');
    const watchedDuration = watch('duration');

    const editMutation = useUpdateClass(editId || '');

    const clearEdit = () => {
        setEditingClass(null);
        if (editId) router.push(pathname);
        reset({
            studentId: '',
            subject: '',
            topic: '',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            duration: '60',
            amount: '',
            status: 'completed',
        });
    };

    const onSubmit = async (data: ClassForm) => {
        const payload = { ...data, duration: parseInt(data.duration), amount: parseFloat(data.amount) };
        if (editingClass) {
            await editMutation.mutateAsync(payload);
            clearEdit();
        } else {
            await createClass.mutateAsync(payload);
            setSuccess(true);
            reset({ studentId: '', subject: '', topic: '', date: new Date().toISOString().split('T')[0], time: '10:00', duration: '60', amount: '', status: 'completed' });
        }
    };

    // State for Bulk Scheduling
    const [selectedDays, setSelectedDays] = useState<Date[]>([]);
    const [bulkTime, setBulkTime] = useState('10:00');
    const [bulkDuration, setBulkDuration] = useState('60');

    const onBulkSubmit = async (data: any) => {
        if (selectedDays.length === 0) {
            toast.error('Pick at least one day on the calendar');
            return;
        }
        const payload = {
            studentId: data.studentId,
            subject: data.subject,
            topic: data.topic,
            classes: selectedDays.map(d => ({ date: format(d, 'yyyy-MM-dd'), time: bulkTime })),
            duration: parseInt(bulkDuration),
            amount: parseFloat(data.amount || '0'),
            notes: data.notes,
        };
        await bulkCreateClasses.mutateAsync(payload);
        setSuccess(true);
        setSelectedDays([]);
    };

    const populateForm = (c: ApiClass) => {
        setEditingClass(c);
        const studentId = c.studentId && typeof c.studentId === 'object' ? c.studentId._id : c.studentId;
        reset({
            studentId,
            subject: c.subject,
            topic: c.topic,
            date: typeof c.date === 'string' ? c.date.split('T')[0] : format(new Date(c.date), 'yyyy-MM-dd'),
            time: c.time,
            duration: String(c.duration),
            amount: String(c.amount),
            notes: c.notes ?? '',
            status: c.status,
        });
    };

    useEffect(() => {
        if (editId && classToEdit && !loadingToEdit && classToEdit._id === editId) {
            if (editingClass?._id !== editId) populateForm(classToEdit);
        } else if (!editId && editingClass) {
            clearEdit();
        }
    }, [editId, classToEdit, loadingToEdit, editingClass]);

    useEffect(() => {
        if (editId || !watchedStudentId) return;
        const student = students.find(s => s._id === watchedStudentId);
        if (student) {
            if (student.subject) setValue('subject', student.subject);
            if (student.feePerClass) {
                const calculated = Math.round((student.feePerClass / 60) * (parseInt(watchedDuration) || 60));
                setValue('amount', String(calculated));
            }
        }
    }, [watchedStudentId, watchedDuration, students, setValue, editId]);

    const statusStyles: Record<string, string> = {
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        ongoing: 'bg-blue-50 text-blue-700 border-blue-100',
        scheduled: 'bg-amber-50 text-amber-700 border-amber-100',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
        rescheduled: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto text-center py-24 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground">Done!</h2>
                    <p className="text-sm text-muted-foreground">The classes have been successfully saved.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl font-semibold" onClick={() => setSuccess(false)}>
                    Add More Classes
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 mt-4">
            {/* Header Content */}
            <div className="flex flex-col items-center text-center space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                    <span className="bg-emerald-600 text-white p-1.5 rounded-lg"><Plus className="w-6 h-6" /></span>
                    Class Management
                </h1>
                <p className="text-sm text-muted-foreground max-w-lg">
                    Streamline your teaching schedule. Record individual sessions or bulk schedule recurring classes with ease.
                </p>
            </div>

            {/* Compact Professional Tabs (Pills) */}
            <Tabs defaultValue="single" className="w-full flex flex-col items-center">
                <TabsList className="bg-white/50 backdrop-blur-sm border border-border p-1 rounded-full shadow-sm mb-8 h-10 w-fit">
                    <TabsTrigger 
                        value="single" 
                        className="rounded-full px-6 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-300"
                    >
                        Create Class
                    </TabsTrigger>
                    <TabsTrigger 
                        value="bulk"
                        className="rounded-full px-6 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-300"
                    >
                        Bulk Schedule Class
                    </TabsTrigger>
                </TabsList>

                {/* Form Sections */}
                <div className="w-full max-w-4xl">
                    <TabsContent value="single" className="focus-visible:outline-none">
                        <Card className="border shadow-md rounded-2xl overflow-hidden bg-card">
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Name</Label>
                                            <Controller name="studentId" control={control} render={({ field }) => (
                                                <Select value={field.value} onValueChange={v => field.onChange(v ?? '')}>
                                                    <SelectTrigger className="h-12 rounded-xl border-border/80 focus:ring-emerald-500 text-sm font-medium">
                                                        <SelectValue placeholder="Select student" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {students.filter(s => s.status === 'active' || s._id === field.value).map(s => (
                                                            <SelectItem key={s._id} value={s._id}>{s.name} — {s.subject}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                            {errors.studentId && <p className="text-xs text-rose-500 ml-1">{errors.studentId.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject Area</Label>
                                            <Input className="h-12 rounded-xl" placeholder="e.g. Science" {...register('subject')} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topics Covered</Label>
                                            <Input className="h-12 rounded-xl" placeholder="Detailed Topic Name" {...register('topic')} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                                                <Input type="date" className="h-12 rounded-xl" {...register('date')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</Label>
                                                <Input type="time" className="h-12 rounded-xl" {...register('time')} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                                                <Controller name="duration" control={control} render={({ field }) => (
                                                    <Select value={field.value} onValueChange={v => field.onChange(v ?? '')}>
                                                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {['30', '45', '60', '75', '90', '120'].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Earnings (₹)</Label>
                                                <Input type="number" className="h-12 rounded-xl" {...register('amount')} />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 pt-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Class Status</Label>
                                            <Controller name="status" control={control} render={({ field }) => (
                                                <div className="flex flex-wrap gap-2">
                                                    {['completed', 'ongoing', 'scheduled', 'cancelled'].map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => field.onChange(val)}
                                                            className={cn(
                                                                "px-5 py-2.5 rounded-full text-xs font-bold capitalize transition-all border",
                                                                field.value === val 
                                                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                                                                    : "bg-white border-border text-muted-foreground hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {val}
                                                        </button>
                                                    ))}
                                                </div>
                                            )} />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faculty Remarks</Label>
                                            <Textarea className="rounded-xl min-h-[100px]" placeholder="Student progress notes..." {...register('notes')} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-border">
                                        <Button type="button" variant="ghost" onClick={clearEdit} className="text-muted-foreground hover:text-foreground rounded-xl px-6">
                                            Reset
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 h-12 shadow-md shadow-emerald-500/10 gap-2 font-bold"
                                            disabled={createClass.isPending || editMutation.isPending}
                                        >
                                            {(createClass.isPending || editMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {editingClass ? 'Update Record' : 'Create Class Session'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="bulk" className="focus-visible:outline-none">
                        <Card className="border shadow-md rounded-2xl overflow-hidden bg-white">
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit(onBulkSubmit)} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Student</Label>
                                                <Controller name="studentId" control={control} render={({ field }) => (
                                                    <Select value={field.value} onValueChange={v => field.onChange(v ?? '')}>
                                                        <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {students.filter(s => s.status === 'active').map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</Label>
                                                    <Input type="time" className="h-12 rounded-xl" value={bulkTime} onChange={e => setBulkTime(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                                                    <Select value={bulkDuration} onValueChange={v => setBulkDuration(v ?? '')}>
                                                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {['30', '45', '60', '75', '90', '120'].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</Label>
                                                <Input className="h-12 rounded-xl" placeholder="e.g. Biology" {...register('subject')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic/Course</Label>
                                                <Input className="h-12 rounded-xl" placeholder="Full Module Name" {...register('topic')} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Schedule on Calendar</Label>
                                            <div className="p-4 border border-border/60 rounded-2xl bg-slate-50 shadow-inner flex justify-center">
                                                <Calendar mode="multiple" selected={selectedDays} onSelect={(days) => setSelectedDays(days || [])} className="rounded-md" />
                                            </div>
                                            
                                            {selectedDays.length > 0 && (
                                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in fade-in duration-300">
                                                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                        <History className="w-3 h-3" /> Selected Dates ({selectedDays.length})
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                                        {selectedDays.map(d => <Badge key={d.toISOString()} className="bg-white text-emerald-700 border-emerald-100 text-[9px] font-bold px-1.5 h-5 shadow-sm">{format(d, 'dd MMM')}</Badge>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                                        <Button 
                                            type="submit" 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-12 h-14 shadow-lg shadow-emerald-500/10 gap-3 font-extrabold text-base"
                                            disabled={bulkCreateClasses.isPending || selectedDays.length === 0}
                                        >
                                            {bulkCreateClasses.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarIcon className="w-5 h-5" />}
                                            Schedule {selectedDays.length} Classes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Session History Table - Below Form */}
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-600" /> Session History & Activity
                        </h2>
                        <p className="text-xs text-muted-foreground">Manage and track your recent individual and scheduled sessions.</p>
                    </div>
                </div>

                <Card className="border shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {classesLoading ? (
                            <div className="flex items-center justify-center py-20 px-4"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
                        ) : allClasses.length === 0 ? (
                            <div className="text-center py-20 px-4 space-y-3">
                                <History className="w-10 h-10 mx-auto text-muted-foreground opacity-20" />
                                <p className="text-sm font-medium text-muted-foreground">No recent activity found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                                <Table>
                                    <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-b border-border hover:bg-transparent">
                                            <TableHead className="w-[180px] text-xs font-bold uppercase tracking-wider text-muted-foreground h-12 px-6">Date & Time</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground h-12 px-6">Student</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground h-12 px-6">Subject & Topic</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground h-12 px-6">Earnings</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground h-12 px-6">Status</TableHead>
                                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground h-12 px-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allClasses.map((c) => {
                                            const student = c.studentId && typeof c.studentId === 'object' ? c.studentId : null;
                                            return (
                                                <TableRow key={c._id} className="group hover:bg-emerald-50/30 transition-colors border-b border-border/60 last:border-0">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{format(new Date(c.date), 'dd MMM yyyy')}</span>
                                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5 uppercase tracking-tight">
                                                                <Clock className="w-3 h-3" /> {c.time} · {c.duration}Min
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                                                {student?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <span className="font-semibold text-sm">{student?.name || 'Unknown'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">{c.subject}</span>
                                                            <span className="text-xs text-muted-foreground line-clamp-1">{c.topic}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <span className="font-extrabold text-sm text-foreground">₹{c.amount}</span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className={cn("text-[10px] py-0 px-2 h-5 font-bold capitalize border", statusStyles[c.status])}>
                                                            {c.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors" onClick={() => router.push(`${pathname}?edit=${c._id}`)}>
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition-colors" onClick={() => setDeleteConfirm(c._id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    {classesData?.pagination && (
                        <div className="border-t border-border">
                            <Pagination 
                                currentPage={classesData.pagination.page} 
                                totalPages={classesData.pagination.totalPages} 
                                onPageChange={setPage} 
                            />
                        </div>
                    )}
                </Card>
            </div>

            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader className="pb-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6 text-rose-600" />
                        </div>
                        <DialogTitle className="text-xl">Delete Record?</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-2">Are you sure you want to remove this session? This action cannot be undone.</p>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" className="rounded-xl" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl" onClick={async () => {
                            if (deleteConfirm) { await deleteClass.mutateAsync(deleteConfirm); setDeleteConfirm(null); }
                        }}>Delete Permanently</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
