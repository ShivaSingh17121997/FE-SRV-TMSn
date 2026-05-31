'use client';

import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    from?: number;
    to?: number;
    total?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, from, to, total }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('ellipsis');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('ellipsis');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-border bg-card/10 gap-4">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground whitespace-nowrap">
                {from != null && to != null && total != null ? (
                    <>
                        Showing <span className="text-foreground">{from}–{to}</span> of{' '}
                        <span className="text-foreground">{total}</span> records
                    </>
                ) : (
                    <>
                        Page <span className="text-foreground">{currentPage}</span> of{' '}
                        <span className="text-foreground">{totalPages}</span>
                    </>
                )}
            </div>

            <UiPagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="cursor-pointer"
                        />
                    </PaginationItem>

                    {getPageNumbers().map((page, i) => (
                        <PaginationItem key={i}>
                            {page === 'ellipsis' ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink
                                    isActive={currentPage === page}
                                    onClick={() => onPageChange(page)}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="cursor-pointer"
                        />
                    </PaginationItem>
                </PaginationContent>
            </UiPagination>
        </div>
    );
}
