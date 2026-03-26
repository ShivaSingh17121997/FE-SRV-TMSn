import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiClass {
    _id: string;
    teacherId: string | { _id: string; name: string; email: string; googleMeetLink?: string };
    studentId: string | { _id: string; name: string; class: string };
    subject: string;
    topic: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
    notes?: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled';
    conducted: boolean;
    missed: boolean;
    actualStartTime?: string;
    actualEndTime?: string;
    createdAt: string;
}

interface ClassesResponse {
    success: boolean;
    data: {
        classes: ApiClass[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
    };
}

interface ClassResponse {
    success: boolean;
    data: { class: ApiClass };
}

export const classKeys = {
    all: ['classes'] as const,
    list: (params?: Record<string, string | number | undefined>) => ['classes', 'list', params] as const,
    detail: (id: string) => ['classes', 'detail', id] as const,
};

export function useClasses(params?: Record<string, string | number | undefined>) {
    return useQuery({
        queryKey: classKeys.list(params),
        queryFn: () => apiGet<ClassesResponse>('/classes', params),
        select: (data) => ({
            classes: data.data.classes,
            pagination: data.data.pagination,
        }),
    });
}

export function useClass(id: string) {
    return useQuery({
        queryKey: classKeys.detail(id),
        queryFn: () => apiGet<ClassResponse>(`/classes/${id}`),
        select: (data) => data.data.class,
        enabled: !!id,
    });
}

export function useCreateClass() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<ApiClass>) => apiPost<ClassResponse>('/classes', body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: classKeys.all });
            toast.success('Class recorded successfully');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to save class'),
    });
}

export function useUpdateClass(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<ApiClass>) => apiPatch<ClassResponse>(`/classes/${id}`, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: classKeys.all });
            qc.invalidateQueries({ queryKey: classKeys.detail(id) });
            toast.success('Class updated successfully');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to update class'),
    });
}

export function useEndClass() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (classId: string) => apiPost<ClassResponse>('/classes/end', { classId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: classKeys.all });
            toast.success('Class marked as completed');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to complete class'),
    });
}

export function useDeleteClass() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiDelete<{ success: boolean }>(`/classes/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: classKeys.all });
            toast.success('Class deleted');
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to delete class'),
    });
}

export function useBulkCreateClasses() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: {
            studentId: string;
            subject: string;
            topic: string;
            classes: { date: string; time: string }[];
            duration: number;
            amount?: number;
            notes?: string;
        }) => apiPost<{ success: boolean; data: { classes: ApiClass[] } }>('/classes/bulk', body),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: classKeys.all });
            toast.success(`${data.data.classes.length} classes scheduled successfully`);
        },
        onError: (err: Error) => toast.error(err.message || 'Failed to schedule bulk classes'),
    });
}
