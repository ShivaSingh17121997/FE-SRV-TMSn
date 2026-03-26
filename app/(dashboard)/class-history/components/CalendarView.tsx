"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { type ApiClass } from "@/lib/hooks/useClasses";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    data: ApiClass[];
    onEventClick: (c: ApiClass) => void;
    onRangeChange?: (range: { start: Date; end: Date }) => void;
    currentDate?: Date;
    onNavigate?: (date: Date) => void;
}

export default function CalendarView({ 
    data, 
    onEventClick, 
    onRangeChange, 
    currentDate, 
    onNavigate 
}: CalendarViewProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const getStudentName = (c: ApiClass) =>
        c.studentId && typeof c.studentId === 'object' ? c.studentId.name : 'N/A';

    const events = data.map(c => {
        // Construct standard JS Date objects from the string date and time
        const startDateString = `${c.date.split('T')[0]}T${c.time}:00`;
        const start = new Date(startDateString);

        // Add duration in minutes to start time
        const end = new Date(start.getTime() + c.duration * 60000);

        return {
            title: `${c.subject} - ${getStudentName(c)}`,
            start,
            end,
            resource: c,
        };
    });
    
    const CustomToolbar = (toolbar: any) => {
        const goToBack = () => {
          toolbar.onNavigate('PREV');
        };
        const goToNext = () => {
          toolbar.onNavigate('NEXT');
        };
        const goToCurrent = () => {
          toolbar.onNavigate('TODAY');
        };
    
        const label = () => {
          const date = toolbar.date;
          return (
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-foreground">
                {format(date, 'MMMM')}
              </span>
              <span className="text-xl font-light text-muted-foreground">
                {format(date, 'yyyy')}
              </span>
            </div>
          );
        };
    
        return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
              <Button variant="ghost" size="sm" onClick={goToBack} className="h-8 px-3">Back</Button>
              <Button variant="ghost" size="sm" onClick={goToCurrent} className="h-8 px-3">Today</Button>
              <Button variant="ghost" size="sm" onClick={goToNext} className="h-8 px-3">Next</Button>
            </div>
    
            {label()}
    
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
              <Button 
                variant={toolbar.view === 'month' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => toolbar.onView('month')}
                className="h-8 px-4"
              >
                Month
              </Button>
              <Button 
                variant={toolbar.view === 'week' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => toolbar.onView('week')}
                className="h-8 px-4"
              >
                Week
              </Button>
              <Button 
                variant={toolbar.view === 'day' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => toolbar.onView('day')}
                className="h-8 px-4"
              >
                Day
              </Button>
            </div>
          </div>
        );
      };

    return (
        <div className="h-[600px] w-full p-4 bg-card rounded-xl border border-border shadow-sm">
            {/* 
                We add a wrapper div with a custom class to target and override 
                react-big-calendar's default styles for dark mode if necessary.
            */}
            <div className={`h-full w-full ${isDark ? 'rbc-dark' : ''}`}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .rbc-dark .rbc-month-view, .rbc-dark .rbc-time-view, .rbc-dark .rbc-header {
                        border-color: var(--border);
                    }
                    .rbc-dark .rbc-day-bg { border-color: var(--border); }
                    .rbc-dark .rbc-off-range-bg { background-color: var(--muted); }
                    .rbc-dark .rbc-today { background-color: rgba(59, 130, 246, 0.1); }
                    .rbc-dark .rbc-button-link { color: var(--foreground); }
                    .rbc-dark .rbc-event { box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
                `}} />

                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%", color: isDark ? 'var(--foreground)' : 'inherit' }}
                    onSelectEvent={(e: any) => onEventClick(e.resource)}
                    eventPropGetter={(event) => {
                        const c = event.resource as ApiClass;
                        let backgroundColor = '#3b82f6';
                        if (c.status === 'completed') backgroundColor = '#10b981';
                        if (c.status === 'cancelled') backgroundColor = '#ef4444';
                        if (c.status === 'rescheduled') backgroundColor = '#f97316';
                        return {
                            style: { backgroundColor, border: 'none', opacity: 0.9, color: 'white', borderRadius: '6px' }
                        };
                    }}
                    components={{
                        toolbar: CustomToolbar,
                    }}
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    date={currentDate}
                    onNavigate={(date) => onNavigate?.(date)}
                    onRangeChange={(range) => {
                        if (Array.isArray(range)) {
                            onRangeChange?.({ start: range[0], end: range[range.length - 1] });
                        } else {
                            onRangeChange?.(range as { start: Date; end: Date });
                        }
                    }}
                    popup
                />
            </div>
        </div>
    );
}
