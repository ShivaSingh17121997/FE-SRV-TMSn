'use client';

import FeedbackForm from '@/components/forms/FeedbackForm';

export default function PublicFeedbackPage() {
    return (
        <main className="fixed inset-0 overflow-y-auto bg-[#fff8f2] scrollbar-hide">
            <div className="min-h-screen w-full">
                <FeedbackForm />
            </div>
        </main>
    );
}
