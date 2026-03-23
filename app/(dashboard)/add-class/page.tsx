'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/lib/hooks/useStudents';
import { useCreateClass, useUpdateClass, useDeleteClass } from '@/lib/hooks/useClasses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses, useClass, type ApiClass } from '@/lib/hooks/useClasses';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, CheckCircle, Loader2, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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

    const { data: studentsData } = useStudents({ teacherId: user?._id });
    const { data: classesData, isLoading: classesLoading } = useClasses({ teacherId: user?._id });
    const { data: classToEdit, isLoading: loadingToEdit } = useClass(editId || '');

    const createClass = useCreateClass();
    const deleteClass = useDeleteClass();

    const students = studentsData?.students ?? [];
    const allClasses = classesData?.classes ?? [];

    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<ClassForm>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            duration: '60',
            status: 'completed',
        },
    });

    const watchedStudentId = watch('studentId');
    const watchedDuration = watch('duration');

    const editMutation = useUpdateClass(editId || '');

    const clearEdit = () => {
        setEditingClass(null);
        if (editId) {
            router.push(pathname);
        }
        reset({
            studentId: '',
            subject: '',
            topic: '',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            duration: '60',
            amount: '',
            notes: '',
            status: 'completed',
        });
    };

    const onSubmit = async (data: ClassForm) => {
        const payload = {
            studentId: data.studentId,
            subject: data.subject,
            topic: data.topic,
            date: data.date,
            time: data.time,
            duration: parseInt(data.duration),
            amount: parseFloat(data.amount),
            notes: data.notes,
            status: data.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled',
        };

        if (editingClass) {
            await editMutation.mutateAsync(payload);
            clearEdit();
        } else {
            await createClass.mutateAsync(payload);
            setSuccess(true);
            reset({
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                duration: '60',
                status: 'completed',
            });
        }
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

    // Sync state with URL editId
    useEffect(() => {
        if (editId) {
            // Populate the form only when data is loaded and matches the URL ID
            if (classToEdit && !loadingToEdit && classToEdit._id === editId) {
                // Avoid re-populating if we already have this class in state
                if (editingClass?._id !== editId) {
                    populateForm(classToEdit);
                }
            }
        } else {
            // If we were editing but the URL ID is gone, clear the state
            if (editingClass) {
                clearEdit();
            }
        }
    }, [editId, classToEdit, loadingToEdit, editingClass]);

    // Auto-fill subject and calculate amount ONLY when creating a new class
    useEffect(() => {
        // Skip auto-fill if we are in Edit mode to prevent overwriting saved data
        if (editId) return;
        if (!watchedStudentId) return;

        const student = students.find(s => s._id === watchedStudentId);
        if (!student) return;

        if (student.subject) setValue('subject', student.subject);

        if (student.feePerClass) {
            const durationNum = parseInt(watchedDuration) || 60;
            const ratePerMin = student.feePerClass / 60;
            const calculatedAmount = Math.round(ratePerMin * durationNum);
            setValue('amount', String(calculatedAmount));
        }
    }, [watchedStudentId, watchedDuration, students, setValue, editId]);

    const statusColor: Record<string, string> = {
        completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        ongoing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        scheduled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        rescheduled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Class Recorded!</h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>The class has been saved to your history.</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSuccess(false)}>
                    Add Another Class
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Add Class</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Record a teaching session</p>
            </div>

            <Card className="shadow-sm border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        {editingClass ? 'Edit Class Session' : 'Session Details'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <Label>Student *</Label>
                                <Controller name="studentId" control={control} render={({ field }) => {
                                    const selectedStudent = students.find(s => s._id === field.value);
                                    return (
                                        <Select value={field.value} onValueChange={v => field.onChange(v ?? '')}>
                                            <SelectTrigger>
                                                {selectedStudent ? (
                                                    <span className="truncate">
                                                        {selectedStudent.name} — {selectedStudent.subject}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">Select student</span>
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                {students.filter(s => s.status === 'active').map(s => (
                                                    <SelectItem key={s._id} value={s._id}>
                                                        {s.name} — {s.subject}
                                                    </SelectItem>
                                                ))}
                                                {/* Show currently selected student even if inactive (editing mode) */}
                                                {editingClass && students.find(s => s._id === field.value && s.status !== 'active') && (
                                                    <SelectItem key={field.value} value={field.value}>
                                                        {students.find(s => s._id === field.value)?.name} (Inactive)
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    );
                                }} />
                                {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Subject *</Label>
                                <Input placeholder="e.g. Mathematics" {...register('subject')} />
                                {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Topic *</Label>
                                <Input placeholder="Today's topic" {...register('topic')} />
                                {errors.topic && <p className="text-xs text-red-500">{errors.topic.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Date *</Label>
                                <Input type="date" {...register('date')} />
                                {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Time *</Label>
                                <Input type="time" {...register('time')} />
                                {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Duration (minutes) *</Label>
                                <Controller name="duration" control={control} render={({ field }) => (
                                    <Select value={field.value} onValueChange={v => field.onChange(v ?? '60')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['30', '45', '60', '75', '90', '120'].map(d => (
                                                <SelectItem key={d} value={d}>{d} min</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="space-y-1"><Label>Amount (₹) *</Label>
                                <Input type="number" placeholder="e.g. 500" {...register('amount')} />
                                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Status *</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select value={field.value} onValueChange={v => field.onChange(v ?? 'completed')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="ongoing">Ongoing</SelectItem>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="col-span-2 space-y-1"><Label>Notes</Label>
                                <Textarea placeholder="Additional notes..." rows={3} {...register('notes')} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            {editingClass && (
                                <Button type="button" variant="outline" onClick={clearEdit}>Cancel Edit</Button>
                            )}
                            <Button type="button" variant="outline" onClick={clearEdit}>Reset</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2" disabled={createClass.isPending || editMutation.isPending}>
                                {(createClass.isPending || editMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingClass ? 'Update Class' : 'Save Class'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Recent Classes List */}
            <div>
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Recent Classes</h2>
                {classesLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : allClasses.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No classes recorded yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allClasses.slice(0, 10).map(c => {
                            const studentName = c.studentId && typeof c.studentId === 'object' ? c.studentId.name : '—';
                            return (
                                <Card key={c._id} className="border shadow-sm hover:shadow-md transition-all" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{studentName}</span>
                                                <Badge className={`text-xs border-0 ${statusColor[c.status] ?? ''}`}>{c.status}</Badge>
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                                                {c.subject} · {c.topic} · {format(new Date(c.date), 'dd MMM yyyy')} · ₹{c.amount}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`${pathname}?edit=${c._id}`)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteConfirm(c._id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete confirm dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Class?</DialogTitle></DialogHeader>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
                            if (deleteConfirm) { await deleteClass.mutateAsync(deleteConfirm); setDeleteConfirm(null); }
                        }}>Delete</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
