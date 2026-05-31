'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeachers, type ApiTeacher, useDeleteTeacher } from '@/lib/hooks/useTeachers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search, GraduationCap, Loader2, AlertCircle, Plus, Video,
    Users, MoreVertical, ExternalLink, Pencil, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { CreateUserDialog } from '@/components/dashboard/CreateUserDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/dashboard/Pagination';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

export default function TeachersPage() {
    const { user } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce: wait 400ms after user stops typing before triggering server search
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(value);
            setPage(1); // Reset to first page on new search
        }, 400);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const { data: teachers, isLoading, isError, error } = useTeachers({
        search: search || undefined,
        page: String(page),
        limit: String(limit)
    });

    const deleteTeacher = useDeleteTeacher();

    const [editingTeacher, setEditingTeacher] = useState<ApiTeacher | null>(null);
    const [deleteTeacherConfirm, setDeleteTeacherConfirm] = useState<ApiTeacher | null>(null);

    const handleDelete = async () => {
        if (!deleteTeacherConfirm) return;
        try {
            await deleteTeacher.mutateAsync(deleteTeacherConfirm._id);
            setDeleteTeacherConfirm(null);
            toast.success(`${deleteTeacherConfirm.name} deleted successfully`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete teacher');
        }
    };

    const teacherList = teachers?.teachers ?? [];

    const formatEarnings = (amount: number) => {
        if (amount === 0) return '₹0';
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
        return `₹${amount}`;
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
    if (isError) return (
        <div className="flex items-center justify-center py-20 gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{(error as Error).message}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Teachers</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                        {teachers?.pagination?.total ?? teacherList.length} teacher{(teachers?.pagination?.total ?? teacherList.length) !== 1 ? 's' : ''} total
                        {teachers?.pagination && ` · showing ${teachers.pagination.from}–${teachers.pagination.to}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search — server-side with debounce */}
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                        <Input
                            placeholder="Search by name, email, subject..."
                            className="pl-8 h-9 text-xs bg-muted/20 border-border/50 focus:ring-1 focus:ring-blue-500/50"
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                        />
                    </div>

                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <CreateUserDialog
                            defaultRole="teacher"
                            onSuccess={() => { }}
                            trigger={
                                <Button className="bg-primary hover:bg-primary/90 text-white gap-2 h-9 px-4 text-xs font-semibold whitespace-nowrap">
                                    <Plus className="w-4 h-4" /> Add Teacher
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Teachers Table */}
            <Card className="shadow-sm bg-card border border-border overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> All Teachers
                    </CardTitle>
                </CardHeader>

                {/* overflow-x-auto ensures horizontal scroll on small screens */}
                <div className="w-full overflow-x-auto">
                    <Table className="min-w-[860px] text-sm">
                        <TableHeader>
                            <TableRow className="bg-muted/80 hover:bg-muted/80 border-b border-border sticky top-0 z-10">
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Teacher</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Email / City</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Subjects</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Students</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Classes</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Earnings</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Meet</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teacherList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <GraduationCap className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-sm">No teachers found</p>
                                            {search && (
                                                <p className="text-xs mt-1 opacity-60">
                                                    Try a different search term
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                teacherList.map((t: ApiTeacher) => (
                                    <TableRow key={t._id} className="border-b border-border/40 hover:bg-accent/50 transition-colors">
                                        {/* Teacher */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 flex-shrink-0">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                        {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <Link href={`/teachers/${t._id}`} className="font-semibold text-sm hover:text-blue-600 transition-colors truncate">
                                                        {t.name}
                                                    </Link>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Joined {t.createdAt ? format(new Date(t.createdAt), 'MMM yyyy') : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Email / City */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-medium truncate">{t.email}</span>
                                                <span className="text-[10px] text-muted-foreground">{t.city || '—'}</span>
                                            </div>
                                        </TableCell>

                                        {/* Subjects */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(t.subjects ?? []).slice(0, 2).map(s => (
                                                    <Badge key={s} className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 border-0 px-1.5">{s}</Badge>
                                                ))}
                                                {(t.subjects ?? []).length > 2 && (
                                                    <span className="text-[10px] text-muted-foreground">+{(t.subjects ?? []).length - 2}</span>
                                                )}
                                                {(t.subjects ?? []).length === 0 && (
                                                    <span className="text-[10px] text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Students count */}
                                        <TableCell className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold">{(t as any).studentCount ?? '—'}</span>
                                        </TableCell>

                                        {/* Classes count */}
                                        <TableCell className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold">{(t as any).classCount ?? '—'}</span>
                                        </TableCell>

                                        {/* Earnings */}
                                        <TableCell className="px-4 py-3">
                                            <span className="font-semibold text-sm text-emerald-600">
                                                {formatEarnings((t as any).totalEarned ?? 0)}
                                            </span>
                                        </TableCell>

                                        {/* Google Meet */}
                                        <TableCell className="px-4 py-3 text-center">
                                            {t.googleMeetLink ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border border-emerald-500/10 rounded-full mx-auto"
                                                    onClick={() => {
                                                        const link = t.googleMeetLink?.startsWith('http') ? t.googleMeetLink : `https://${t.googleMeetLink}`;
                                                        window.open(link, '_blank');
                                                    }}
                                                    title="Join Google Meet"
                                                >
                                                    <Video className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                                        onClick={() => setEditingTeacher(t)}
                                                        title="Edit Teacher"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    {/* Fixed: removed hardcoded text-black that broke dark mode */}
                                                    <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center hover:bg-muted rounded-md transition-colors outline-none text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <Link href={`/teachers/${t._id}`}>
                                                            <DropdownMenuItem className="cursor-pointer gap-2">
                                                                <ExternalLink className="w-3.5 h-3.5" /> View Profile
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => setEditingTeacher(t)} className="cursor-pointer gap-2">
                                                                    <Pencil className="w-3.5 h-3.5" /> Edit Teacher
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeleteTeacherConfirm(t)}
                                                                    className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Teacher
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {teachers?.pagination && (
                    <Pagination
                        currentPage={teachers.pagination.page}
                        totalPages={teachers.pagination.totalPages}
                        onPageChange={setPage}
                        from={teachers.pagination.from}
                        to={teachers.pagination.to}
                        total={teachers.pagination.total}
                    />
                )}
            </Card>

            {/* Edit Dialog */}
            {editingTeacher && (
                <CreateUserDialog
                    open={!!editingTeacher}
                    onOpenChange={(open) => !open && setEditingTeacher(null)}
                    initialData={editingTeacher}
                    onSuccess={() => setEditingTeacher(null)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTeacherConfirm} onOpenChange={(open) => !open && setDeleteTeacherConfirm(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" /> Delete Teacher?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete <strong className="text-foreground">{deleteTeacherConfirm?.name}</strong>?
                            This action cannot be undone. Their students will be set to inactive.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setDeleteTeacherConfirm(null)} className="font-semibold">
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-lg shadow-red-500/20"
                            onClick={handleDelete}
                            disabled={deleteTeacher.isPending}
                        >
                            {deleteTeacher.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Permanently
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
