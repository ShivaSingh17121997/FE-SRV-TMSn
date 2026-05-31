import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, apiDelete } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiTeacher {
    _id: string;
    name: string;
    email: string;
    role: 'teacher' | 'admin' | 'super_admin';
    phone?: string;
    city?: string;
    subjects?: string[];
    qualification?: string;
    experience?: number; // Number in years
    bio?: string;
    profilePhoto?: string;
    googleMeetLink?: string;
    createdAt?: string;
}

interface TeachersResponse {
    success: boolean;
    data: {
        teachers: ApiTeacher[];
        pagination: { total: number; page: number; limit: number; totalPages: number; from: number; to: number; };
    };
}

interface TeacherResponse {
    success: boolean;
    data: { teacher: ApiTeacher; user?: ApiTeacher };
}

interface RegisterResponse {
    success: boolean;
    data: { token: string; user: ApiTeacher };
}

export const teacherKeys = {
    all: ['teachers'] as const,
    list: (params?: Record<string, string | number | undefined>) => ['teachers', 'list', params] as const,
    detail: (id: string) => ['teachers', 'detail', id] as const,
};

export function useTeachers(params?: Record<string, string | number | undefined>, options?: any) {
    return useQuery<TeachersResponse, Error, { teachers: ApiTeacher[]; pagination: TeachersResponse['data']['pagination'] }>({
        queryKey: teacherKeys.list(params),
        queryFn: () => apiGet<TeachersResponse>('/teachers', params),
        select: (data: TeachersResponse) => ({
            teachers: data.data.teachers,
            pagination: data.data.pagination,
        }),
        ...options
    });
}

export function useTeacher(id: string) {
    return useQuery({
        queryKey: teacherKeys.detail(id),
        queryFn: () => apiGet<TeacherResponse>(`/teachers/${id}`),
        select: (data) => data.data.teacher ?? data.data.user,
        enabled: !!id,
    });
}

export function useUpdateTeacher(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<ApiTeacher>) => apiPatch<TeacherResponse>(`/teachers/${id}`, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: teacherKeys.all });
            qc.invalidateQueries({ queryKey: teacherKeys.detail(id) });
        },
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: {
            name: string; email: string; password: string; role: string;
            phone?: string; city?: string; subjects?: string[]; qualification?: string; experience?: number; bio?: string;
        }) => apiPost<RegisterResponse>('/auth/register', body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: teacherKeys.all });
        },
    });
}
export function useDeleteTeacher() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiDelete(`/teachers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: teacherKeys.all });
        },
    });
}
