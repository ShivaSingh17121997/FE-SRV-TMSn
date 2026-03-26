import { type ApiClass, useEndClass } from "@/lib/hooks/useClasses";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Check, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClassTableProps {
    data: ApiClass[];
    onRowClick: (c: ApiClass) => void;
    itemsPerPage: number;
    setItemsPerPage: (val: number) => void;
    currentPage: number;
    setCurrentPage: (val: number) => void;
    isServerSide?: boolean;
}

export default function ClassTable({
    data,
    onRowClick,
    itemsPerPage, setItemsPerPage,
    currentPage, setCurrentPage,
    isServerSide = false
}: ClassTableProps) {
    const { mutate: endClass } = useEndClass();

    const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
    const paginatedData = isServerSide ? data : data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStudentName = (c: ApiClass) =>
        c.studentId && typeof c.studentId === 'object' ? c.studentId.name : 'N/A';

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            rescheduled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        };
        return map[status] ?? 'bg-gray-100 text-gray-700';
    };

    const isTimeOver = (dateStr: string, timeStr: string, duration: number) => {
        try {
            // Extract the date part in local timezone to match UI display
            const d = new Date(dateStr);
            const datePart = format(d, 'yyyy-MM-dd');

            // Construct a local date time: "2026-03-23T10:00"
            const classStartTime = new Date(`${datePart}T${timeStr}`);

            if (isNaN(classStartTime.getTime())) return false;

            // Define end time as start time + duration
            const classEndTime = new Date(classStartTime.getTime() + duration * 60000);

            return new Date() > classEndTime;
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border/40">
                            {['Student', 'Subject', 'Topic', 'Date & Time', 'Duration', 'Amount', 'Status'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((c, i) => (
                            <tr
                                key={c._id}
                                className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer border-b border-border/40 last:border-0"
                            >
                                <td className="px-4 py-3" onClick={() => onRowClick(c)}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {getStudentName(c).split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <span className="font-medium text-foreground">{getStudentName(c)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground" onClick={() => onRowClick(c)}>{c.subject}</td>
                                <td className="px-4 py-3 font-medium text-foreground" onClick={() => onRowClick(c)}>{c.topic}</td>
                                <td className="px-4 py-3 text-muted-foreground" onClick={() => onRowClick(c)}>
                                    <div>{format(new Date(c.date), 'dd MMM yyyy')}</div>
                                    <div className="text-xs">{c.time}</div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground" onClick={() => onRowClick(c)}>{c.duration} min</td>
                                <td className={`px-4 py-3 font-semibold ${c.status === 'completed' ? 'text-emerald-600 dark:text-emerald-500' : 'text-emerald-600/40 dark:text-emerald-500/40'}`} onClick={() => onRowClick(c)}>₹{c.amount}</td>
                                <td className="px-4 py-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="focus:outline-none">
                                            <Badge className={`text-xs border-0 cursor-pointer ${getStatusColor(c.status)} hover:opacity-80 transition-opacity`}>
                                                {c.status}
                                            </Badge>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            {(c.status === 'ongoing' || (c.status === 'scheduled' && isTimeOver(c.date, c.time, c.duration))) && (
                                                <DropdownMenuItem
                                                    className="text-green-600 cursor-pointer font-medium gap-2 focus:text-green-600"
                                                    onClick={() => endClass(c._id)}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Mark as Completed
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => onRowClick(c)}>
                                                View Class Details
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No classes found</p>
                                </td>
                            </tr>
                        )}
                        {data.length > 0 && (
                            <tr className="bg-muted/20 border-t-2 border-border/40 font-semibold">
                                <td colSpan={5} className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Total Summary</td>
                                <td className="px-4 py-3 text-emerald-600">₹{data.filter(c => c.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls - Only show if NOT server side (since ClassHistoryPage handles it itself now) */}
            {!isServerSide && data.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rows per page:</span>
                        <select
                            className="bg-background border border-border rounded-md text-xs px-2 py-1"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalPages} ({data.length} total)
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="outline" size="sm" className="h-7 px-2"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            >
                                Prev
                            </Button>
                            <Button
                                variant="outline" size="sm" className="h-7 px-2"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
