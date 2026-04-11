'use client';

import { useState } from 'react';
import { 
    MessageSquare, 
    Star, 
    MoreHorizontal, 
    Eye, 
    Trash2, 
    Download,
    Filter,
    Search,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    Share2,
    Loader2,
    Check
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FeedbackForm from '@/components/forms/FeedbackForm';
import { useFeedbacks, useDeleteFeedback, ApiFeedback } from '@/lib/hooks/useFeedbacks';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function FeedbacksPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [selectedFeedback, setSelectedFeedback] = useState<ApiFeedback | null>(null);
    
    // Using proper empty searches vs populated over debounce ideally, but direct state updates here
    const { data: feedbackData, isLoading } = useFeedbacks({ 
        search: searchQuery || undefined, 
        page: page.toString(), 
        limit: '10' 
    });
    
    const deleteFeedback = useDeleteFeedback();

    const feedbacks: ApiFeedback[] = feedbackData?.data || [];
    const totalCount = feedbackData?.pagination?.total || 0;
    const totalPages = feedbackData?.pagination?.totalPages || 1;

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                        key={s} 
                        className={`w-4 h-4 ${s <= rating ? "fill-orange-400 text-orange-400" : "text-gray-300"}`} 
                    />
                ))}
            </div>
        );
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/feedback`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Student Feedback Form',
                    text: 'Please share your feedback to help us improve SRV Learning.',
                    url: url
                });
                toast.success("Shared successfully!");
            } catch (error) {
                console.log("Share cancelled or failed", error);
            }
        } else {
            navigator.clipboard.writeText(url).then(() => {
                toast.success("Feedback link copied to clipboard! Paste it anywhere to open the form.");
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await deleteFeedback.mutateAsync(id);
            toast.success('Feedback deleted successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete');
        }
    };

    // Calculate generic stats based on returned data
    const averageRating = feedbacks.length > 0 
        ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
        : '0.0';
    
    const satisfactionRate = feedbacks.length > 0
        ? Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Student Feedbacks</h1>
                    <p className="text-muted-foreground">Manage and analyze feedback from your students.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4" />
                        Share Link
                    </Button>
                    <Dialog>
                        <DialogTrigger 
                            render={
                                <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20" />
                            }
                        >
                            <Plus className="w-4 h-4" />
                            Preview Form
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden p-0 border-none bg-transparent shadow-none">
                            <div className="flex-1 overflow-y-auto w-full rounded-2xl bg-[#fff8f2] scrollbar-hide">
                                <FeedbackForm />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <p className="text-xs text-muted-foreground">Total submissions received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {averageRating} <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">From current page data</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{satisfactionRate}%</div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full bg-green-500 w-[${satisfactionRate}%]`} style={{ width: `${satisfactionRate}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Feedback List</CardTitle>
                            <CardDescription>A detailed list of all student submissions.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search feedback..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Quality</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : feedbacks.length > 0 ? (
                                    feedbacks.map((fb) => (
                                        <TableRow key={fb._id}>
                                            <TableCell className="font-medium text-xs text-muted-foreground">{fb._id.slice(-6).toUpperCase()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">
                                                            {(fb.name || "A")[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{fb.name || "Anonymous"}</span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                            {fb.comment || "No comment provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{renderStars(fb.rating)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal capitalize text-xs">
                                                    {fb.teachingQuality.split(' ')[0]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                                                {format(new Date(fb.createdAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground outline-none text-black">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setSelectedFeedback(fb)}>
                                                                <Eye className="w-4 h-4" /> View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="gap-2 text-red-600 cursor-pointer"
                                                                onClick={() => handleDelete(fb._id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No feedbacks found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing <strong>{feedbacks.length}</strong> of <strong>{totalCount}</strong>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold font-serif">Feedback Summary</DialogTitle>
                    </DialogHeader>
                    {selectedFeedback && (
                        <div className="space-y-5 mt-4">
                            <div className="flex justify-between items-center bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <div>
                                    <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Overall Rating</h4>
                                    <div className="flex gap-1">{renderStars(selectedFeedback.rating)}</div>
                                </div>
                                <div className="text-right">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date Submitted</h4>
                                                    <p className="text-sm font-semibold">{format(new Date(selectedFeedback.createdAt), 'MMM dd, yyyy')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-bold">
                                                        {(selectedFeedback.name || "A")[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">Submitted By</h4>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedFeedback.name || "Anonymous"}</p>
                                                </div>
                                            </div>
                                            
                                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1">Teaching Quality</h4>
                                <Badge variant="outline" className="text-sm py-1 px-3 bg-white">{selectedFeedback.teachingQuality}</Badge>
                            </div>

                            {selectedFeedback.whatTheyLike && selectedFeedback.whatTheyLike.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">What They Liked</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFeedback.whatTheyLike.map(liked => (
                                            <Badge key={liked} className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                                <Check className="w-3 h-3 mr-1" /> {liked}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1">Suggested Improvement</h4>
                                <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {selectedFeedback.improvement}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1">Additional Comments</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-100 italic">
                                    {selectedFeedback.comment ? `"${selectedFeedback.comment}"` : "No additional comments provided."}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}