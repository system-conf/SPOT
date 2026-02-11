"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    maxVisiblePages?: number;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    showPageNumbers = true,
    maxVisiblePages = 5,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const halfVisible = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, currentPage - halfVisible);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // İlk sayfa
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) {
                pages.push("...");
            }
        }

        // Orta sayfalar
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Son sayfa
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push("...");
            }
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = showPageNumbers ? getPageNumbers() : [];

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {showPageNumbers && pages.map((page, index) => (
                typeof page === "number" ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all ${
                            currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-white/5 hover:bg-white/10 text-gray-300"
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span
                        key={index}
                        className="min-w-[40px] h-10 flex items-center justify-center text-gray-500"
                    >
                        {page}
                    </span>
                )
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}
