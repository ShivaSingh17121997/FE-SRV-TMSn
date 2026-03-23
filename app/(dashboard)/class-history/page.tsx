'use client';

import { useState, useMemo } from 'react';
import { useClasses, type ApiClass } from '@/lib/hooks/useClasses';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, LayoutList, Calendar as CalendarIcon } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Button } from '@/components/ui/button';

import StatsCards from './components/StatsCards';
import Filters from './components/Filters';
import ExportButtons from './components/ExportButtons';
import ClassTable from './components/ClassTable';
import ClassModal from './components/ClassModal';
import CalendarView from './components/CalendarView';

export default function ClassHistoryPage() {
    const { user } = useAuth();
    const { data, isLoading, isError, error } = useClasses({ teacherId: user?._id });
    const classes = data?.classes ?? [];

    // Filter States
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [quickDateFilter, setQuickDateFilter] = useState('all');

    // View State
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

    // Pagination State
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [selectedClass, setSelectedClass] = useState<ApiClass | null>(null);

    // Derived Data
    const uniqueSubjects = useMemo(() => {
        const subs = new Set(classes.map(c => c.subject));
        return Array.from(subs).sort();
    }, [classes]);

    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            // Search
            const student = c.studentId && typeof c.studentId === 'object' ? c.studentId : null;
            const studentName = student?.name ?? '';
            const searchLower = search.toLowerCase();
            const matchSearch = c.topic.toLowerCase().includes(searchLower) ||
                studentName.toLowerCase().includes(searchLower) ||
                c.subject.toLowerCase().includes(searchLower) ||
                c.date.includes(searchLower);

            // Filters
            const matchStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchSubject = subjectFilter === 'all' || c.subject === subjectFilter;

            // Date filtering
            let matchDate = true;
            if (quickDateFilter !== 'all') {
                const classDate = new Date(c.date);
                if (quickDateFilter === 'today') matchDate = isToday(classDate);
                else if (quickDateFilter === 'this_week') matchDate = isThisWeek(classDate);
                else if (quickDateFilter === 'this_month') matchDate = isThisMonth(classDate);
            }

            return matchSearch && matchStatus && matchSubject && matchDate;
        });
    }, [classes, search, statusFilter, subjectFilter, quickDateFilter]);

    // Calculate Statistics
    const stats = useMemo(() => {
        let completed = 0;
        let scheduled = 0;
        let earnings = 0;

        filteredClasses.forEach(c => {
            if (c.status === 'completed') {
                completed++;
                earnings += c.amount;
            } else if (c.status === 'scheduled') {
                scheduled++;
            }
        });

        return {
            totalClasses: filteredClasses.length,
            completedClasses: completed,
            scheduledClasses: scheduled,
            totalEarnings: earnings,
        };
    }, [filteredClasses]);

    if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (isError) return <div className="flex items-center justify-center py-20 gap-2 text-red-500"><AlertCircle className="w-5 h-5" /><span className="text-sm">{(error as Error).message}</span></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto mb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Class History</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage and view your past and upcoming sessions</p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportButtons data={filteredClasses} />

                    <div className="flex bg-muted p-1 rounded-lg border border-border">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 rounded-md px-3 gap-2"
                            onClick={() => setViewMode('table')}
                        >
                            <LayoutList className="w-4 h-4" />
                            <span className="hidden sm:inline">Table</span>
                        </Button>
                        <Button
                            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 rounded-md px-3 gap-2"
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Calendar</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Analytics Overview */}
            <StatsCards {...stats} />

            {/* Control Panel (Filters) */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <Filters
                    search={search} setSearch={setSearch}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    subjectFilter={subjectFilter} setSubjectFilter={setSubjectFilter}
                    quickDateFilter={quickDateFilter} setQuickDateFilter={setQuickDateFilter}
                    uniqueSubjects={uniqueSubjects}
                />
            </div>

            {/* Main Content Area */}
            <div className="bg-card border border-border rounded-xl shadow-sm min-h-[500px]">
                {viewMode === 'table' ? (
                    <ClassTable
                        data={filteredClasses}
                        onRowClick={(c) => setSelectedClass(c)}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                ) : (
                    <CalendarView
                        data={filteredClasses}
                        onEventClick={(c) => setSelectedClass(c)}
                    />
                )}
            </div>

            {/* Reusable Modal for specific class */}
            <ClassModal
                isOpen={!!selectedClass}
                onClose={() => setSelectedClass(null)}
                classData={selectedClass}
            />
        </div>
    );
}
