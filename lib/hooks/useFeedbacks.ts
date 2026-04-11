import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiFeedback {
    _id: string;
    name?: string;
    rating: number;
    teachingQuality: string;
    whatTheyLike: string[];
    improvement: string;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

export function useFeedbacks({ search, page = '1', limit = '50' }: { search?: string; page?: string; limit?: string } = {}) {
    return useQuery({
        queryKey: ['feedbacks', { search, page, limit }],
        queryFn: async () => {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({ page, limit });
            if (search) params.append('search', search);

            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/feedbacks?${params.toString()}`, {
                headers
            });
            if (!res.ok) throw new Error('Failed to fetch feedbacks');
            const data = await res.json();
            return data;
        }
    });
}

export function useSubmitFeedback() {
    return useMutation({
        mutationFn: async (payload: { name?: string, q1: number | null, q2: string | null, q3: string[], q4: string | null, q5: string }) => {
            const res = await fetch(`${API_URL}/feedbacks/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to submit feedback');
            }
            return res.json();
        }
    });
}

export function useDeleteFeedback() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const token = localStorage.getItem('authToken');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/feedbacks/${id}`, {
                method: 'DELETE',
                headers
            });
            if (!res.ok) throw new Error('Failed to delete feedback');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
        }
    });
}
