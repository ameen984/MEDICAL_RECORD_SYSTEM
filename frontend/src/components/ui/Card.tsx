import React from 'react';

interface CardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

export default function Card({ title, value, icon: Icon, iconColor = 'bg-primary-500 text-white', trend }: CardProps) {
    return (
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl hover:shadow-md transition-all border border-gray-100">
            <div className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 ${iconColor} rounded-2xl p-3 shadow-sm`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <dl>
                            <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</dt>
                            <dd className="flex items-baseline">
                                <div className={`font-semibold text-gray-900 leading-none ${String(value).length < 8 ? 'text-3xl' : 'text-lg'}`}>
                                    {value}
                                </div>
                                {trend && (
                                    <div
                                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                                        }`}
                                    >
                                        {trend.value}
                                    </div>
                                )}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
