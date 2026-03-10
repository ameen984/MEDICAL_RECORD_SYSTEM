import React from 'react';

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    keyExtractor?: (item: T) => string;
}

export default function Table<T>({ data, columns, onRowClick, isLoading, keyExtractor }: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="h-4 bg-gray-50 rounded-full"></div>
                        <div className="h-4 bg-gray-50 rounded-full"></div>
                        <div className="h-4 bg-gray-50 rounded-full"></div>
                        <div className="h-4 bg-gray-50 rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="mx-auto h-12 w-12 text-gray-200 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No results found</p>
                <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or search terms.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                    {data.map((item, _index) => (
                        <tr
                            key={keyExtractor ? keyExtractor(item) : (item as any).id || (item as any)._id || _index}
                            onClick={() => onRowClick?.(item)}
                            className={`
                                group transition-all duration-200
                                ${onRowClick ? 'hover:bg-primary-50/30 cursor-pointer' : 'hover:bg-gray-50/30'}
                            `}
                        >
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                    {column.render
                                        ? column.render(item)
                                        : String((item as any)[column.key] || '-')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
