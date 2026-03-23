import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type ApiClass } from "@/lib/hooks/useClasses";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    classData: ApiClass | null;
}

export default function ClassModal({ isOpen, onClose, classData }: ClassModalProps) {
    const router = useRouter();
    if (!classData) return null;

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

    const handleEdit = () => {
        onClose();
        router.push(`/add-class?edit=${classData._id}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Class Details</span>
                        <Badge className={`border-0 ${getStatusColor(classData.status)}`}>
                            {classData.status.toUpperCase()}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Complete information for this session.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Student</p>
                            <p className="text-base text-foreground font-semibold">{getStudentName(classData)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Subject</p>
                            <p className="text-base text-foreground font-semibold">{classData.subject}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Topic</p>
                        <p className="text-base text-foreground">{classData.topic}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Date & Time</p>
                            <p className="text-base text-foreground">
                                {format(new Date(classData.date), 'dd MMM yyyy')} at {classData.time}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Duration & Amount</p>
                            <p className="text-base text-foreground">
                                {classData.duration} min — <span className="text-emerald-500 font-semibold">₹{classData.amount}</span>
                            </p>
                        </div>
                    </div>

                    {((classData as any).notes || (classData as any).homework) && (
                        <div className="pt-2 border-t border-border mt-4">
                            {(classData as any).notes && (
                                <div className="mb-3">
                                    <p className="text-sm text-muted-foreground font-medium">Notes</p>
                                    <p className="text-sm text-foreground bg-muted p-2 rounded-md mt-1">{(classData as any).notes}</p>
                                </div>
                            )}
                            {(classData as any).homework && (
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Homework</p>
                                    <p className="text-sm text-foreground bg-muted p-2 rounded-md mt-1">{(classData as any).homework}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button variant="secondary" onClick={handleEdit}>Edit Session</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
