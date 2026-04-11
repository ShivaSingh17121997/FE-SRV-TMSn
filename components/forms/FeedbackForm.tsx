'use client';

import { useState, useEffect } from 'react';
import { Star, Check, Send, Clock, Sparkles, Loader2 } from 'lucide-react';
import { useSubmitFeedback } from '@/lib/hooks/useFeedbacks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent! 🌟'];

export default function FeedbackForm() {
    const [answers, setAnswers] = useState<{
        name: string;
        q1: number | null;
        q2: string | null;
        q3: string[];
        q4: string | null;
        q5: string;
    }>({
        name: '',
        q1: null,
        q2: null,
        q3: [],
        q4: null,
        q5: '',
    });

    const [submitted, setSubmitted] = useState(false);
    const [progress, setProgress] = useState(0);

    const updateProgress = () => {
        let done = 0;
        if (answers.q1) done++;
        if (answers.q2) done++;
        if (answers.q3.length > 0) done++;
        if (answers.q4) done++;
        if (answers.q5.trim()) done++;
        setProgress((done / 5) * 100);
        return done;
    };

    useEffect(() => {
        updateProgress();
    }, [answers]);

    const handleStarClick = (val: number) => {
        setAnswers(prev => ({ ...prev, q1: val }));
    };

    const handleSingleSelect = (q: 'q2' | 'q4', val: string) => {
        setAnswers(prev => ({ ...prev, [q]: val }));
    };

    const handleMultiSelect = (val: string) => {
        setAnswers(prev => {
            const has = prev.q3.includes(val);
            if (has) return { ...prev, q3: prev.q3.filter(v => v !== val) };
            return { ...prev, q3: [...prev.q3, val] };
        });
    };

    const submitFeedback = useSubmitFeedback();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answers.q1 || !answers.q2 || !answers.q4) {
            alert('Please answer the key questions before submitting. 🙏');
            return;
        }

        try {
            await submitFeedback.mutateAsync({
                name: answers.name.trim() || undefined,
                q1: answers.q1,
                q2: answers.q2,
                q3: answers.q3,
                q4: answers.q4,
                q5: answers.q5
            });
            setSubmitted(true);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to submit feedback');
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto mt-10">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-5xl shadow-xl shadow-orange-500/20 mb-8 animate-bounce">
                    🎉
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 font-serif">Thank You for Your Feedback!</h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-md">
                    Your response has been recorded. We truly value your thoughts and will use them to make SRV Learning even better for you.
                </p>
                <div className="pt-8 border-t w-full">
                    <p className="text-orange-600 font-extrabold tracking-widest uppercase text-sm">
                        SRV Learning · Where Learning Evolves
                    </p>
                </div>
                <Button 
                    className="mt-8 bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                        setSubmitted(false);
                        setAnswers({ name: '', q1: null, q2: null, q3: [], q4: null, q5: '' });
                    }}
                >
                    Submit Another Response
                </Button>
            </div>
        );
    }

    const doneCount = Math.round((progress / 100) * 5);

    return (
        <div className="h-full w-full bg-[#fff8f2] pb-20 relative">
            {/* Header */}
            <header className="relative overflow-hidden bg-gradient-to-br from-[#1a0a02] via-[#2d1206] to-[#1a0a02] py-12 px-6 text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,rgba(232,84,26,0.25)_0%,transparent_65%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_100%,rgba(255,201,64,0.12)_0%,transparent_50%)]" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-orange-600 to-yellow-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-orange-600/40">
                            SRV
                        </div>
                        <span className="text-2xl font-black text-white tracking-wide">
                            SRV <span className="text-yellow-400">Learning</span>
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-serif">Share Your Feedback</h1>
                    <p className="text-white/60 text-base mb-6">Help us serve you better — your opinion matters</p>
                    <div className="flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-500 px-4 py-1.5 rounded-full text-sm font-bold">
                        <Clock className="w-4 h-4" />
                        Takes only 2 minutes
                    </div>
                </div>
            </header>

            {/* Progress */}
            <div className="max-w-xl mx-auto px-6 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-black/5 flex items-center gap-4">
                    <Progress value={progress} className="h-2.5 flex-1 bg-gray-100" />
                    <span className="text-sm font-black text-orange-600 min-w-[50px] text-right">
                        {doneCount} / 5
                    </span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-6 mt-6 space-y-5">
                
                {/* Intro: Name Field */}
                <div className={cn(
                    "bg-white rounded-2xl p-6 border-1.5 transition-all shadow-sm",
                    answers.name.trim() ? "border-orange-200 shadow-orange-100/50" : "border-[#f0ddd0]"
                )}>
                    <h3 className="text-lg font-bold text-[#2d1a0a] leading-tight mb-2 font-serif">
                        What's your name? <span className="text-sm font-normal text-gray-500 italic">*(Optional)*</span>
                    </h3>
                    <Input 
                        placeholder="John Doe"
                        className="rounded-xl border-1.5 border-[#f0ddd0] focus-visible:ring-orange-500 focus-visible:border-orange-500 bg-orange-50/20 py-6"
                        value={answers.name}
                        onChange={(e) => setAnswers(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>

                {/* Q1: Star Rating */}
                <div className={cn(
                    "bg-white rounded-2xl p-6 border-1.5 transition-all shadow-sm",
                    answers.q1 ? "border-orange-200 shadow-orange-100/50" : "border-[#f0ddd0]"
                )}>
                    <p className="text-[11px] font-extrabold text-orange-600 tracking-widest uppercase mb-2">Question 1 of 5</p>
                    <h3 className="text-lg font-bold text-[#2d1a0a] leading-tight mb-6 font-serif">
                        How would you rate your overall experience with SRV Learning?
                    </h3>
                    <div className="flex justify-center gap-3 mb-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handleStarClick(val)}
                                className={cn(
                                    "text-4xl transition-all hover:scale-125 focus:outline-none",
                                    answers.q1 && val <= answers.q1 ? "scale-110 grayscale-0 opacity-100" : "grayscale opacity-30"
                                )}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-sm font-bold text-orange-600 h-5 mt-2 transition-all">
                        {starLabels[answers.q1 || 0]}
                    </p>
                </div>

                {/* Q2: Teaching Quality */}
                <div className={cn(
                    "bg-white rounded-2xl p-6 border-1.5 transition-all shadow-sm",
                    answers.q2 ? "border-orange-200 shadow-orange-100/50" : "border-[#f0ddd0]"
                )}>
                    <p className="text-[11px] font-extrabold text-orange-600 tracking-widest uppercase mb-2">Question 2 of 5</p>
                    <h3 className="text-lg font-bold text-[#2d1a0a] leading-tight mb-4 font-serif">
                        How clear and effective is the teaching method?
                    </h3>
                    <div className="space-y-2.5">
                        {[
                            "Very clear and easy to understand",
                            "Good, but some topics need more explanation",
                            "Average — concepts could be explained better",
                            "Needs significant improvement"
                        ].map((option) => (
                            <div
                                key={option}
                                onClick={() => handleSingleSelect('q2', option)}
                                className={cn(
                                    "flex items-center gap-3 p-3.5 border-1.5 rounded-xl cursor-pointer transition-all font-semibold text-sm",
                                    answers.q2 === option 
                                        ? "border-orange-500 bg-orange-50/50 text-orange-700" 
                                        : "border-[#f0ddd0] hover:border-orange-300 hover:bg-[#fff5f0] text-[#2d1a0a]"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                                    answers.q2 === option ? "border-orange-500 bg-orange-500" : "border-[#f0ddd0]"
                                )}>
                                    {answers.q2 === option && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                {option}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Q3: What they like */}
                <div className={cn(
                    "bg-white rounded-2xl p-6 border-1.5 transition-all shadow-sm",
                    answers.q3.length > 0 ? "border-orange-200 shadow-orange-100/50" : "border-[#f0ddd0]"
                )}>
                    <p className="text-[11px] font-extrabold text-orange-600 tracking-widest uppercase mb-2">Question 3 of 5</p>
                    <h3 className="text-lg font-bold text-[#2d1a0a] leading-tight mb-4 font-serif">
                        What do you like most about SRV Learning? <span className="text-sm font-normal text-gray-500 italic block mt-1">*(Select all that apply)*</span>
                    </h3>
                    <div className="space-y-2.5">
                        {[
                            "1:1 personalised attention",
                            "Faculty expertise & credentials",
                            "Flexible scheduling",
                            "Affordable pricing",
                            "Study materials provided"
                        ].map((option) => (
                            <div
                                key={option}
                                onClick={() => handleMultiSelect(option)}
                                className={cn(
                                    "flex items-center gap-3 p-3.5 border-1.5 rounded-xl cursor-pointer transition-all font-semibold text-sm",
                                    answers.q3.includes(option) 
                                        ? "border-orange-500 bg-orange-50/50 text-orange-700" 
                                        : "border-[#f0ddd0] hover:border-orange-300 hover:bg-[#fff5f0] text-[#2d1a0a]"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all",
                                    answers.q3.includes(option) ? "border-orange-500 bg-orange-500 text-white" : "border-[#f0ddd0]"
                                )}>
                                    {answers.q3.includes(option) && <Check className="w-3.5 h-3.5" />}
                                </div>
                                {option}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Q4: Improvement */}
                <div className={cn(
                    "bg-white rounded-2xl p-6 border-1.5 transition-all shadow-sm",
                    answers.q4 ? "border-orange-200 shadow-orange-100/50" : "border-[#f0ddd0]"
                )}>
                    <p className="text-[11px] font-extrabold text-orange-600 tracking-widest uppercase mb-2">Question 4 of 5</p>
                    <h3 className="text-lg font-bold text-[#2d1a0a] leading-tight mb-4 font-serif">
                        What should we improve to serve you better?
                    </h3>
                    <div className="space-y-2.5">
                        {[
                            "More practice questions & tests",
                            "Better study materials & notes",
                            "More subject options",
                            "Faster doubt resolution",
                            "Everything is great! 🎉"
                        ].map((option) => (
                            <div
                                key={option}
                                onClick={() => handleSingleSelect('q4', option)}
                                className={cn(
                                    "flex items-center gap-3 p-3.5 border-1.5 rounded-xl cursor-pointer transition-all font-semibold text-sm",
                                    answers.q4 === option 
                                        ? "border-orange-500 bg-orange-50/50 text-orange-700" 
                                        : "border-[#f0ddd0] hover:border-orange-300 hover:bg-[#fff5f0] text-[#2d1a0a]"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                                    answers.q4 === option ? "border-orange-500 bg-orange-500" : "border-[#f0ddd0]"
                                )}>
                                    {answers.q4 === option && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                {option}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Q5: Suggestions */}
                <div className={cn(
                    "bg-white rounded-2xl p-6 border-1.5 transition-all shadow-sm",
                    answers.q5.trim() ? "border-orange-200 shadow-orange-100/50" : "border-[#f0ddd0]"
                )}>
                    <p className="text-[11px] font-extrabold text-orange-600 tracking-widest uppercase mb-2">Question 5 of 5</p>
                    <h3 className="text-lg font-bold text-[#2d1a0a] leading-tight mb-4 font-serif">
                        Any suggestions or comments for us? <span className="text-sm font-normal text-gray-500 italic block mt-1">*(Optional)*</span>
                    </h3>
                    <Textarea 
                        placeholder="Write your thoughts here... We read every response! 🙏"
                        className="min-h-[120px] rounded-xl border-1.5 border-[#f0ddd0] focus-visible:ring-orange-500 focus-visible:border-orange-500 bg-orange-50/20"
                        value={answers.q5}
                        onChange={(e) => setAnswers(prev => ({ ...prev, q5: e.target.value }))}
                    />
                </div>

                <Button 
                    type="submit"
                    disabled={submitFeedback.isPending}
                    className="w-full justify-center gap-2 py-7 text-lg font-black tracking-wide rounded-2xl shadow-lg shadow-orange-600/30 bg-gradient-to-r from-orange-600 to-orange-400 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                    {submitFeedback.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>Submit Feedback <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                </Button>
            </form>
        </div>
    );
}
