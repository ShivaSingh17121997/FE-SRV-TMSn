import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface TeacherOnboarding {
    _id: string;
    // Step 1 — Personal
    fullName: string;
    alias?: string;
    gender: string;
    dob: string;
    mobile: string;
    whatsapp?: string;
    email: string;
    address: string;
    city: string;
    pin: string;
    // Step 2 — Teaching
    qualification: string;
    stream?: string;
    university: string;
    passYear?: number;
    experience: string;
    mode: string;
    subjects: string[];
    boards?: string;
    rate: number;
    prevInstitutions?: string;
    bio?: string;
    // Step 3 — Bank
    accName: string;
    accNumber: string;
    ifsc: string;
    bankName: string;
    branch?: string;
    accType: string;
    upiId?: string;
    payMethod: string;
    payCycle?: string;
    // Step 4 — Documents
    aadhaar: string;
    pan?: string;
    emergName: string;
    emergPhone: string;
    emergRelation?: string;
    notes?: string;
    // Meta
    status: 'pending' | 'reviewed' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface OnboardingsResponse {
    success: boolean;
    data: {
        onboardings: TeacherOnboarding[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            from: number;
            to: number;
        };
    };
}

interface OnboardingResponse {
    success: boolean;
    data: { onboarding: TeacherOnboarding };
}

export type CreateOnboardingPayload = Omit<TeacherOnboarding, '_id' | 'status' | 'reviewedBy' | 'reviewedAt' | 'createdAt' | 'updatedAt'>;

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const onboardingKeys = {
    all: ['onboardings'] as const,
    list: (params?: Record<string, string | number | undefined>) =>
        ['onboardings', 'list', params] as const,
    detail: (id: string) => ['onboardings', 'detail', id] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────

/** List all onboarding submissions (admin only) */
export function useOnboardings(params?: Record<string, string | number | undefined>) {
    return useQuery<
        OnboardingsResponse,
        Error,
        { onboardings: TeacherOnboarding[]; pagination: OnboardingsResponse['data']['pagination'] }
    >({
        queryKey: onboardingKeys.list(params),
        queryFn: () => apiGet<OnboardingsResponse>('/onboarding/teacher', params),
        select: (data) => ({
            onboardings: data.data.onboardings,
            pagination: data.data.pagination,
        }),
    });
}

/** Get single onboarding (admin only) */
export function useOnboarding(id: string) {
    return useQuery({
        queryKey: onboardingKeys.detail(id),
        queryFn: () => apiGet<OnboardingResponse>(`/onboarding/teacher/${id}`),
        select: (data) => data.data.onboarding,
        enabled: !!id,
    });
}

/** Submit the public onboarding form (no auth required — uses fetch directly) */
export function useCreateOnboarding() {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return useMutation({
        mutationFn: (payload: CreateOnboardingPayload) =>
            fetch(`${BASE_URL}/onboarding/teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || 'Submission failed');
                return data;
            }),
    });
}

/** Update onboarding status or fields (admin only) */
export function useUpdateOnboarding(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<TeacherOnboarding>) =>
            apiPatch<OnboardingResponse>(`/onboarding/teacher/${id}`, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: onboardingKeys.all });
            qc.invalidateQueries({ queryKey: onboardingKeys.detail(id) });
        },
    });
}

/** Delete onboarding (admin only) */
export function useDeleteOnboarding() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiDelete(`/onboarding/teacher/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: onboardingKeys.all });
        },
    });
}
