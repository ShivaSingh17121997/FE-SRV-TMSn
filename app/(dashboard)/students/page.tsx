'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useCheckStudentEmail, useChangeStudentPassword, type ApiStudent } from '@/lib/hooks/useStudents';
import { useTeachers } from '@/lib/hooks/useTeachers';
import { useClasses } from '@/lib/hooks/useClasses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/dashboard/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, Users, Loader2, AlertCircle, CheckCircle2, Info, MoreVertical, Calendar, Clock, Video, Shield, Key } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const studentSchema = z.object({
    name: z.string().min(2, 'Name required'),
    class: z.string().min(1, 'Class required'),
    school: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    email: z.union([z.string().email('Valid email required'), z.literal('')]).optional(),
    password: z.string().optional(),
    subject: z.string().min(2, 'Subject required'),
    feePerClass: z.string().optional(),
    startDate: z.string().min(1, 'Start date required'),
    status: z.enum(['active', 'inactive', 'pending']),
    notes: z.string().optional(),
    teacherId: z.string().optional(),
});
type StudentForm = z.infer<typeof studentSchema>;

export default function StudentsPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const limit = 10;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [assigningStudent, setAssigningStudent] = useState<ApiStudent | null>(null);
    const [changePasswordStudent, setChangePasswordStudent] = useState<ApiStudent | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Email check state
    const [emailValue, setEmailValue] = useState('');
    const [emailExists, setEmailExists] = useState<{ exists: boolean; name?: string } | null>(null);
    const [emailChecking, setEmailChecking] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, isLoading, isError, error } = useStudents({ 
        search: search || undefined,
        page: String(page),
        limit: String(limit),
    });
    const createStudent = useCreateStudent();
    const updateStudent = useUpdateStudent(editingId ?? '');
    const deleteStudent = useDeleteStudent();
    const checkEmail = useCheckStudentEmail();
    const { data: teachersData } = useTeachers();
    const teachers = teachersData ?? [];
    const { data: classesData } = useClasses();
    const allClasses = classesData?.classes ?? [];

    const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<StudentForm>({
        resolver: zodResolver(studentSchema),
        defaultValues: { status: 'active', startDate: new Date().toISOString().split('T')[0] },
    });

    const watchedEmail = watch('email');

    // Debounced email check
    useEffect(() => {
        const email = watchedEmail?.trim() ?? '';

        // Only check on Add mode (not Edit), and if email looks valid
        if (editingId || !email || !email.includes('@')) {
            setEmailExists(null);
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        setEmailChecking(true);
        debounceTimer.current = setTimeout(async () => {
            try {
                const result = await checkEmail.mutateAsync(email);
                if (result.data.exists) {
                    setEmailExists({ exists: true, name: result.data.user?.name });
                } else {
                    setEmailExists({ exists: false });
                }
            } catch {
                setEmailExists(null);
            } finally {
                setEmailChecking(false);
            }
        }, 600);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [watchedEmail, editingId]);

    const students = data?.students ?? [];
    const filtered = statusFilter === 'all' ? students : students.filter(s => s.status === statusFilter);

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        };
        return map[status] ?? '';
    };

    const openAdd = () => {
        setEditingId(null);
        setEmailExists(null);
        setEmailValue('');
        reset({ status: 'active', startDate: new Date().toISOString().split('T')[0], teacherId: (user?.role === 'super_admin' || user?.role === 'admin') ? '' : user?._id });
        setDialogOpen(true);
    };

    const openAssign = (s: ApiStudent) => {
        setAssigningStudent(s);
    };

    const openEdit = (s: ApiStudent) => {
        setEditingId(s._id);
        setEmailExists(null);
        setEmailValue(s.email ?? '');
        reset({
            name: s.name, class: s.class, school: s.school,
            parentName: s.parentName, parentPhone: s.parentPhone,
            email: s.email ?? '', password: '', subject: s.subject,
            feePerClass: s.feePerClass != null ? String(s.feePerClass) : '',
            startDate: s.startDate.split('T')[0],
            status: s.status, notes: s.notes ?? '',
        });
        setDialogOpen(true);
    };

    const onSubmit = async (data: StudentForm) => {
        const parsed = {
            ...data,
            feePerClass: data.feePerClass ? parseFloat(data.feePerClass) : 0,
        };
        if (editingId) {
            await updateStudent.mutateAsync(parsed);
        } else {
            const payload = emailExists?.exists
                ? { ...parsed, password: undefined }
                : parsed;
            await createStudent.mutateAsync(payload);
        }
        setDialogOpen(false);
        setEmailExists(null);
        reset();
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    if (isError) return (
        <div className="flex items-center justify-center py-20 gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-sm text-red-500">{(error as Error).message}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                            {user?.role === 'teacher' ? 'My Students' : 'All Students'}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    {/* Compact Search & Filter */}
                    <div className="hidden md:flex items-center gap-2 ml-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                            <Input 
                                placeholder="Search students..." 
                                className="pl-8 h-9 text-xs bg-muted/20 border-border/50 focus:ring-1 focus:ring-blue-500/50" 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
                            <SelectTrigger className="w-32 h-9 text-xs bg-muted/20 border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Mobile Search - visible only on small screens */}
                    <div className="md:hidden relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-8 h-9 text-xs" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                    <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-white gap-2 h-9 px-4 text-xs font-semibold">
                        <Plus className="w-4 h-4" /> Add Student
                    </Button>
                </div>
            </div>

            {/* Students Table */}
            <Card className="shadow-sm bg-card border border-border overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> My Students
                    </CardTitle>
                </CardHeader>
                <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-muted/80 hover:bg-muted/80 border-b border-border">
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground w-[120px]">Date/Time</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Student</TableHead>
                                {(user?.role === 'super_admin' || user?.role === 'admin') && <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Teacher</TableHead>}
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Subject</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Fee (₹)</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Classes</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Users className="w-10 h-10 mb-3 opacity-20 text-primary" />
                                            <p className="font-semibold text-lg">No students found</p>
                                            <p className="text-sm opacity-70">We couldn't find any students matching your criteria.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((s) => {
                                    const studentClasses = allClasses.filter(c => 
                                        c.studentId && (typeof c.studentId === 'string' ? c.studentId === s._id : (c.studentId as any)._id === s._id)
                                    );
                                    const completedClasses = studentClasses.filter(c => c.status === 'completed').length;
                                    const totalClasses = studentClasses.length;

                                    return (
                                        <TableRow key={s._id} className="border-b border-border/40 hover:bg-accent/50 transition-colors">
                                            <TableCell className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                        {s.startDate ? format(new Date(s.startDate), 'dd MMM yyyy') : 'N/A'}
                                                    </div>
                                                    {studentClasses.length > 0 && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {studentClasses[0].time || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <Link href={`/students/${s._id}`} className="font-semibold text-sm hover:text-blue-600 transition-colors">
                                                            {s.name}
                                                        </Link>
                                                        <span className="text-[11px] text-muted-foreground line-clamp-1">{s.school} · {s.class}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{s.teacherId && typeof s.teacherId === 'object' ? (s.teacherId as any).name : 'Unknown'}</span>
                                                            {s.teacherId && typeof s.teacherId === 'object' && (s.teacherId as any).googleMeetLink && (
                                                                <button 
                                                                    onClick={() => window.open((s.teacherId as any).googleMeetLink?.startsWith('http') ? (s.teacherId as any).googleMeetLink : `https://${(s.teacherId as any).googleMeetLink}`, '_blank')}
                                                                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors"
                                                                    title="Join Google Meet"
                                                                >
                                                                    <Video className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">ID: {s.teacherId && typeof s.teacherId === 'object' ? (s.teacherId as any)._id.slice(-6) : 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell className="px-4 py-3">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 font-medium">
                                                    {s.subject}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <span className="font-semibold text-sm">₹{s.feePerClass || 0}</span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{completedClasses} / {totalClasses}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Done</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge className={`text-[10px] uppercase tracking-wider font-bold border-0 ${statusBadge(s.status)}`}>
                                                    {s.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center hover:bg-muted rounded-md transition-colors outline-none text-black mx-auto mr-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 text-black">
                                                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                                            <DropdownMenuItem onClick={() => openAssign(s)} className="gap-2 cursor-pointer">
                                                                <Users className="w-4 h-4 text-blue-600" /> Assign Teacher
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => openEdit(s)} className="gap-2 cursor-pointer">
                                                            <Pencil className="w-4 h-4 text-emerald-600" /> Edit Student
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setChangePasswordStudent(s)} className="gap-2 cursor-pointer">
                                                            <Key className="w-4 h-4 text-purple-600" /> Change Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => setDeleteConfirm(s._id)} 
                                                            className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete Student
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                        {filtered.length > 0 && (
                            <tfoot>
                                <tr className="bg-muted/20 border-t-2 border-border/40 font-semibold">
                                    <td colSpan={4} className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Total Summary</td>
                                    <td className="px-4 py-3 text-emerald-600">₹{filtered.reduce((acc, curr) => acc + (curr.feePerClass || 0), 0).toLocaleString('en-IN')} / class</td>
                                    <td className="px-4 py-3 text-center">{filtered.length} students</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                </div>
                {data?.pagination && (
                    <Pagination 
                        currentPage={data.pagination.page} 
                        totalPages={data.pagination.totalPages} 
                        onPageChange={setPage} 
                    />
                )}
            </Card>

            {/* Delete confirm */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Student?</DialogTitle></DialogHeader>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={async () => {
                                if (deleteConfirm) {
                                    await deleteStudent.mutateAsync(deleteConfirm);
                                    setDeleteConfirm(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) { setEmailExists(null); setEmailValue(''); }
            }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1"><Label>Full Name *</Label>
                                <Input placeholder="Student name" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Class *</Label>
                                <Input placeholder="e.g. Grade 10" {...register('class')} />
                                {errors.class && <p className="text-xs text-red-500">{errors.class.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Subject *</Label>
                                <Input placeholder="e.g. Math" {...register('subject')} />
                                {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Fee Per Class (₹)</Label>
                                <Input type="number" placeholder="e.g. 500" {...register('feePerClass')} />
                            </div>

                            {/* Teacher Selection (for Admins) */}
                            {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                <div className="col-span-2 space-y-1">
                                    <Label>Assign Teacher *</Label>
                                    <Controller
                                        name="teacherId"
                                        control={control}
                                        rules={{ required: !editingId }}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(teachers as any)?.teachers?.map((t: any) => (
                                                        <SelectItem key={t._id} value={t._id}>{t.name} ({t.email})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.teacherId && <p className="text-xs text-red-500">Teacher assignment is required</p>}
                                </div>
                            )}

                            {/* ─── Portal Access Section ─── */}
                            <div className="col-span-2 pt-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Student Portal Access</p>
                            </div>

                            {/* Email field with live check indicator */}
                            <div className="col-span-2 space-y-1">
                                <Label>Student Email</Label>
                                <div className="relative">
                                    <Input
                                        type="email"
                                        placeholder="student@email.com"
                                        className="pr-8"
                                        {...register('email')}
                                    />
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                        {emailChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                        {!emailChecking && emailExists?.exists === true && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        {!emailChecking && emailExists?.exists === false && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                                    </div>
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            {/* Smart email status banner */}
                            {!editingId && emailExists?.exists === true && (
                                <div className="col-span-2 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                                            Student account already exists!
                                        </p>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                            <strong>{emailExists.name}</strong> already has a portal login. No need to set a new password — just add the email above and this student will be linked to your class automatically.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!editingId && emailExists?.exists === false && watchedEmail && watchedEmail.includes('@') && (
                                <div className="col-span-2 flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">New student account will be created</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">A portal login will be set up with the password below. Leave blank to use the default: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">student123</code></p>
                                    </div>
                                </div>
                            )}

                            {/* Password field — shown for new students OR when admin/teacher edits */}
                            {(!editingId || (user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'teacher')) && emailExists?.exists !== true && (
                                <div className="col-span-2 space-y-1">
                                    <Label>{editingId ? 'New Password' : 'Password'}</Label>
                                    <Input
                                        type="password"
                                        placeholder={editingId ? 'Leave blank to keep current' : 'student123 (Default)'}
                                        {...register('password')}
                                    />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                    {editingId && <p className="text-[10px] text-muted-foreground">Updating the password here will change the portal login for this student's email.</p>}
                                </div>
                            )}

                            <div className="space-y-1"><Label>Start Date *</Label>
                                <Input type="date" {...register('startDate')} />
                                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                            </div>
                            <div className="space-y-1"><Label>Status *</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select value={field.value} onValueChange={v => field.onChange(v ?? 'active')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="col-span-2 space-y-1"><Label>Notes</Label>
                                <Input placeholder="Additional notes..." {...register('notes')} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={createStudent.isPending || updateStudent.isPending}
                            >
                                {(createStudent.isPending || updateStudent.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? 'Save Changes' : 'Add Student'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Another Teacher Dialog */}
            <AssignTeacherDialog
                student={assigningStudent}
                teachers={teachers}
                onClose={() => setAssigningStudent(null)}
            />

            {/* Dedicated Change Password Dialog */}
            <ChangePasswordDialog
                student={changePasswordStudent}
                onClose={() => setChangePasswordStudent(null)}
            />
        </div>
    );
}

function ChangePasswordDialog({ student, onClose }: { student: ApiStudent | null; onClose: () => void }) {
    const changePassword = useChangeStudentPassword();
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { password: '' }
    });

    useEffect(() => {
        if (student) reset({ password: '' });
    }, [student, reset]);

    const onSubmit = async (data: any) => {
        if (!student || !student.email) return;
        await changePassword.mutateAsync({ email: student.email, password: data.password });
        onClose();
    };

    return (
        <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Change Student Password
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Setting a new password for <strong>{student?.name}</strong> ({student?.email})
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label>New Password *</Label>
                        <Input 
                            type="password" 
                            placeholder="Enter new password" 
                            {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} 
                        />
                        {errors.password && <p className="text-xs text-red-500">{(errors.password as any).message}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={changePassword.isPending}
                        >
                            {changePassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AssignTeacherDialog({ student, teachers, onClose }: { 
    student: ApiStudent | null; 
    teachers: any; 
    onClose: () => void 
}) {
    const createStudent = useCreateStudent();
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        defaultValues: {
            teacherId: '',
            subject: '',
            feePerClass: '',
            startDate: new Date().toISOString().split('T')[0],
        }
    });

    useEffect(() => {
        if (student) {
            reset({
                teacherId: '',
                subject: student.subject,
                feePerClass: student.feePerClass ? String(student.feePerClass) : '',
                startDate: new Date().toISOString().split('T')[0],
            });
        }
    }, [student, reset]);

    const onSubmit = async (data: any) => {
        if (!student) return;
        
        const payload = {
            name: student.name,
            class: student.class,
            school: student.school,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            email: student.email,
            subject: data.subject,
            feePerClass: parseFloat(data.feePerClass || '0'),
            teacherId: data.teacherId,
            startDate: data.startDate,
            status: 'active' as const,
        };

        await createStudent.mutateAsync(payload);
        onClose();
    };

    return (
        <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Another Teacher</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Assigning <strong>{student?.name}</strong> to an additional teacher for a different subject.
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label>Select Teacher *</Label>
                        <Controller
                            name="teacherId"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger><SelectValue placeholder="Choose teacher" /></SelectTrigger>
                                    <SelectContent>
                                        {(teachers as any)?.teachers?.map((t: any) => (
                                            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.teacherId && <p className="text-xs text-red-500">Teacher is required</p>}
                    </div>

                    <div className="space-y-1">
                        <Label>Subject *</Label>
                        <Input placeholder="e.g. Physics" {...register('subject', { required: 'Required' })} />
                        {errors.subject && <p className="text-xs text-red-500">Subject is required</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Fee Per Class (₹)</Label>
                            <Input type="number" placeholder="500" {...register('feePerClass')} />
                        </div>
                        <div className="space-y-1">
                            <Label>Start Date</Label>
                            <Input type="date" {...register('startDate', { required: 'Required' })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={createStudent.isPending}
                        >
                            {createStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Assignment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
