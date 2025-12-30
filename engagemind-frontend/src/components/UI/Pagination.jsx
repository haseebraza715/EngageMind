import React from 'react';
import { cn } from '../../lib/utils';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    showFirstLast = true,
    className = '',
    ...props
}) => {
    const getPageNumbers = () => {
        const totalNumbers = siblingCount * 2 + 3;
        const totalBlocks = totalNumbers + 2;

        if (totalPages <= totalBlocks) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, '...', totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [1, '...', ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [1, '...', ...middleRange, '...', totalPages];
        }

        return [];
    };

    const pages = getPageNumbers();

    const PageButton = ({ page, label, disabled = false, active = false }) => (
        <button
            onClick={() => !disabled && !active && onPageChange(page)}
            disabled={disabled || active}
            className={cn(
                'min-w-[2.5rem] h-10 px-3 flex items-center justify-center rounded-lg font-medium transition-all duration-200',
                active
                    ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg'
                    : disabled
                        ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
        >
            {label}
        </button>
    );

    return (
        <nav
            role="navigation"
            aria-label="Pagination"
            className={cn('flex items-center justify-center gap-1', className)}
            {...props}
        >
            {/* First Page */}
            {showFirstLast && (
                <PageButton
                    page={1}
                    label="First"
                    disabled={currentPage === 1}
                />
            )}

            {/* Previous */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                    'h-10 px-3 flex items-center gap-1 rounded-lg font-medium transition-all duration-200',
                    currentPage === 1
                        ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
                aria-label="Previous page"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`dots-${index}`}
                                className="min-w-[2.5rem] h-10 flex items-center justify-center text-neutral-400"
                            >
                                ...
                            </span>
                        );
                    }

                    return (
                        <PageButton
                            key={page}
                            page={page}
                            label={page.toString()}
                            active={currentPage === page}
                        />
                    );
                })}
            </div>

            {/* Next */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                    'h-10 px-3 flex items-center gap-1 rounded-lg font-medium transition-all duration-200',
                    currentPage === totalPages
                        ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
                aria-label="Next page"
            >
                <span className="hidden sm:inline">Next</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Last Page */}
            {showFirstLast && (
                <PageButton
                    page={totalPages}
                    label="Last"
                    disabled={currentPage === totalPages}
                />
            )}
        </nav>
    );
};

// Simple Pagination (without page numbers)
export const SimplePagination = ({
    currentPage,
    totalPages,
    onPageChange,
    showPageInfo = true,
    className = '',
    ...props
}) => {
    return (
        <nav
            role="navigation"
            aria-label="Pagination"
            className={cn('flex items-center justify-between', className)}
            {...props}
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    currentPage === 1
                        ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
            </button>

            {showPageInfo && (
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Page {currentPage} of {totalPages}
                </span>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    currentPage === totalPages
                        ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
            >
                Next
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </nav>
    );
};

export default Pagination;
