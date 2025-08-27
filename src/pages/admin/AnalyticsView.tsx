import React, { useMemo } from 'react';
import { AnalyticsData, DailyCount } from '../../types';
import { Icon } from '@iconify/react';

interface BarChartProps {
    data: { label: string; value: number }[];
    title: string;
    barColor: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, barColor }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0) || 1, [data]);

    return (
        <div className="bg-tg-secondary-bg-hover p-4 rounded-lg">
            <h3 className="font-bold mb-4 text-tg-text">{title}</h3>
            {data.length > 0 ? (
                <div className="flex items-end h-64 space-x-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                            <div
                                className="w-full rounded-t-md transition-all duration-300"
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: barColor,
                                }}
                                title={`${item.label}: ${item.value}`}
                            >
                                <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white text-xs text-center rounded-md p-1 -mt-8 transition-opacity">
                                    {item.value}
                                </div>
                            </div>
                            <div className="text-xs text-tg-hint mt-1 whitespace-nowrap transform -rotate-45">
                                {item.label}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-tg-hint">
                    <Icon icon="lucide:bar-chart-3" className="h-12 w-12" />
                    <p className="mt-2">Недостатньо даних для побудови графіка</p>
                </div>
            )}
        </div>
    );
};


interface AnalyticsViewProps {
    analyticsData: AnalyticsData;
}

const processChartData = (dailyCounts: DailyCount[]) => {
    const sortedData = [...dailyCounts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedData.map(item => ({
        label: new Date(item.date).toLocaleDateString('uk-UA', { month: 'numeric', day: 'numeric' }),
        value: item.count,
    }));
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analyticsData }) => {
    const userChartData = useMemo(() => processChartData(analyticsData.userRegistrations), [analyticsData.userRegistrations]);
    const adChartData = useMemo(() => processChartData(analyticsData.adPostings), [analyticsData.adPostings]);

    return (
        <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <BarChart data={userChartData} title="Реєстрації користувачів (30 днів)" barColor="#3e9de6" />
                 <BarChart data={adChartData} title="Створення оголошень (30 днів)" barColor="#26a545" />
            </div>
        </div>
    );
};

export default AnalyticsView;