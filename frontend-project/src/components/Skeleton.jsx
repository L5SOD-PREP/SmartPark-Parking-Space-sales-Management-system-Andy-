import React from 'react';

export function TableSkeleton({ rows = 5, cols = 6 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="skeleton h-6 rounded flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
        </div>
    );
}

export function GridSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
        </div>
    );
}
