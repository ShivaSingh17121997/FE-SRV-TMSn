import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000,  // 2 minutes — balance freshness vs. network
            gcTime: 10 * 60 * 1000,    // 10 minutes — keep unused cache in memory
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            refetchOnWindowFocus: false, // Don't refetch on tab switch
        },
    },
});
