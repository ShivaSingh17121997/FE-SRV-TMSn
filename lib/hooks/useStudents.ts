import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiStudent {
    _id: string;
    teacherId: string | { _id: string; name: string; email: string; googleMeetLink?: string };
    name: string;
    class: string;
    school: string;
    parentName: string;
    parentPhone: string;
    email?: string;
    password?: string;
    subject: string;
    feePerClass?: number;
    startDate: string;
    status: 'active' | 'inactive' | 'pending';
    notes?: string;
    createdAt: string;
}

interface StudentsResponse {
    success: boolean;
    data: {
        students: ApiStudent[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
    };
}

interface StudentResponse {
    success: boolean;
    data: { student: ApiStudent };
}

export const studentKeys = {
    all: ['students'] as const,
    list: (params?: Record<string, string | undefined>) => ['students', 'list', params] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
};

export function useStudents(params?: Record<string, string | undefined>) {
    return useQuery({
        queryKey: studentKeys.list(params),
        queryFn: () => apiGet<StudentsResponse>('/students', params),
        select: (data) => ({
            students: data.data.students,
            pagination: data.data.pagination,
        }),
    });
}

export function useStudent(id: string) {
    return useQuery({
        queryKey: studentKeys.detail(id),
        queryFn: () => apiGet<StudentResponse>(`/students/${id}`),
        select: (data) => data.data.student,
        enabled: !!id,
    });
}

export function useCreateStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<ApiStudent>) => apiPost<StudentResponse>('/students', body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: studentKeys.all });
            toast.success('Student added successfully');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to add student'),
    });
}

export function useUpdateStudent(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<ApiStudent>) => apiPatch<StudentResponse>(`/students/${id}`, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: studentKeys.all });
            qc.invalidateQueries({ queryKey: studentKeys.detail(id) });
            toast.success('Student updated successfully');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to update student'),
    });
}

export function useDeleteStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiDelete<{ success: boolean }>(`/students/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: studentKeys.all });
            toast.success('Student deleted');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to delete student'),
    });
}

export interface CheckEmailResponse {
    success: boolean;
    data: {
        exists: boolean;
        user: { name: string } | null;
    };
}

export function useCheckStudentEmail() {
    return useMutation({
        mutationFn: (email: string) => apiPost<CheckEmailResponse>('/students/check-email', { email }),
    });
}

export function useChangeStudentPassword() {
    return useMutation({
        mutationFn: (data: { email: string; password: string }) => apiPost<{ success: boolean }>('/students/change-password', data),
        onSuccess: () => toast.success('Password changed successfully'),
        onError: (err: Error) => toast.error(err.message || 'Failed to change password'),
    });
}
