'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useOnboardings,
    useDeleteOnboarding,
    useUpdateOnboarding,
    useCreateOnboarding,
    type TeacherOnboarding,
    onboardingKeys,
} from '@/lib/hooks/useOnboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search, ClipboardList, Loader2, AlertCircle, Link2,
    Trash2, Eye, Share2, Check, Plus, X,
    MoreVertical, UserCheck, UserX, Clock, RefreshCw
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pagination } from '@/components/dashboard/Pagination';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

// ─── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
    pending:  { label: 'Pending',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
    reviewed: { label: 'Reviewed', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400', icon: RefreshCw },
    approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400', icon: UserCheck },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400', icon: UserX },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
            <Icon className="w-3 h-3" /> {cfg.label}
        </span>
    );
}

// ─── Subjects list ────────────────────────────────────────────────────────────
const SUBJECTS = [
    'Physics','Chemistry','Biology','Mathematics','English',
    'Hindi','History','Geography','Economics','Accountancy',
    'Computer Sc.','Sanskrit','Political Sc.','Psychology','Other',
];


const Err = ({ id, errors }: { id: string, errors: Record<string, string> }) => errors[id] ? (
    <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors[id]}</p>
) : null;

const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
        {children}{req && <span className="text-amber-500 ml-0.5">*</span>}
    </label>
);

// ─── Add Onboarding Modal (full 4-step inline form) ───────────────────────────
function AddOnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const qc = useQueryClient();
    const createMutation = useCreateOnboarding();

    const [step, setStep] = useState<1|2|3|4>(1);
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string,string>>({});
    const [success, setSuccess] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const done = new Set<number>();
    for (let i = 1; i < step; i++) done.add(i);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target as HTMLInputElement;
        const checked = (e.target as HTMLInputElement).checked;
        const key = id.replace('mob-', '');
        setFormData((prev: any) => ({
            ...prev,
            [key]: type === 'checkbox' ? checked : value
        }));
        if (errors[key]) {
            setErrors((prev: any) => { const newErr = { ...prev }; delete newErr[key]; return newErr; });
        }
    };

    // reset when modal opens
    useEffect(() => {
        if (open) {
            setStep(1); setFormData({});
            setErrors({}); setSuccess(false);
        }
    }, [open]);

    function fv(id: string) { return typeof formData[id] === 'string' ? formData[id].trim() : (formData[id] || ''); }

    function validate(s: 1|2|3|4): boolean {
        const e: Record<string,string> = {};
        if (s === 1) {
            if (!fv('fullName')) e.fullName = 'Required';
            if (!fv('gender')) e.gender = 'Required';
            if (!fv('dob')) e.dob = 'Required';
            if (!/^\d{10}$/.test(fv('mobile'))) e.mobile = 'Enter valid 10-digit mobile';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fv('email'))) e.email = 'Enter valid email';
            if (!fv('address')) e.address = 'Required';
            if (!fv('city')) e.city = 'Required';
            if (!/^\d{6}$/.test(fv('pin'))) e.pin = 'Enter valid 6-digit PIN';
        }
        if (s === 2) {
            if (!fv('qualification')) e.qualification = 'Required';
            if (!fv('university')) e.university = 'Required';
            if (!fv('experience')) e.experience = 'Required';
            if (!fv('mode')) e.mode = 'Required';
            if (!fv('rate')) e.rate = 'Required';
            if ((formData.subjects || []).length === 0) e.subjects = 'Select at least one subject';
        }
        if (s === 3) {
            if (!fv('accName')) e.accName = 'Required';
            if (!fv('accNumber')) e.accNumber = 'Required';
            if (fv('accNumber') !== fv('accConfirm')) e.accConfirm = fv('accConfirm') ? "Numbers don't match" : 'Required';
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(fv('ifsc'))) e.ifsc = 'Invalid IFSC';
            if (!fv('bankName')) e.bankName = 'Required';
            if (!fv('accType')) e.accType = 'Required';
            if (!fv('payMethod')) e.payMethod = 'Required';
        }
        if (s === 4) {
            if (!/^\d{12}$/.test(fv('aadhaar'))) e.aadhaar = 'Enter valid 12-digit Aadhaar';
            if (!fv('emergName')) e.emergName = 'Required';
            if (!/^\d{10}$/.test(fv('emergPhone'))) e.emergPhone = 'Enter valid 10-digit number';
            const c1 = { checked: formData.consent1 };
            const c2 = { checked: formData.consent2 };
            if (!c1?.checked || !c2?.checked) e.consent = 'Please accept required declarations';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function next() {
        if (!validate(step)) return;
        
        setStep(s => (s + 1) as 1|2|3|4);
    }
    function back() { setStep(s => (s - 1) as 1|2|3|4); }

    async function submit() {
        if (!validate(4)) return;
        const payload = {
            fullName: fv('fullName'), alias: fv('alias'), gender: fv('gender') as any,
            dob: fv('dob'), mobile: fv('mobile'), whatsapp: fv('whatsapp'), email: fv('email'),
            address: fv('address'), city: fv('city'), pin: fv('pin'),
            qualification: fv('qualification'), stream: fv('stream'), university: fv('university'),
            passYear: fv('passYear') ? Number(fv('passYear')) : undefined,
            experience: fv('experience'), mode: fv('mode'), subjects: formData.subjects || [],
            boards: fv('boards'), rate: Number(fv('rate')),
            prevInstitutions: fv('prevInstitutions'), bio: fv('bio'),
            accName: fv('accName'), accNumber: fv('accNumber'),
            ifsc: fv('ifsc').toUpperCase(), bankName: fv('bankName'),
            branch: fv('branch'), accType: fv('accType') as any,
            upiId: fv('upiId'), payMethod: fv('payMethod'), payCycle: fv('payCycle'),
            aadhaar: fv('aadhaar'), pan: fv('pan').toUpperCase() || undefined,
            emergName: fv('emergName'), emergPhone: fv('emergPhone'),
            emergRelation: fv('emergRelation'), notes: fv('notes'),
        };
        try {
            await createMutation.mutateAsync(payload as any);
            qc.invalidateQueries({ queryKey: onboardingKeys.all });
            toast.success(`${payload.fullName} onboarded successfully!`);
            onClose();
        } catch (err) {
            setErrors({ submit: err instanceof Error ? err.message : 'Submission failed' });
        }
    }

    // helpers
    const cls = (id: string) => errors[id] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500';
    const inputCls = (id: string) =>
        `w-full text-[13px] text-gray-800 bg-white rounded-lg px-3 py-2 border outline-none transition-all ${cls(id)}`;
    const selectCls = (id: string) =>
        `w-full text-[13px] text-gray-800 bg-white rounded-lg px-3 py-2 border outline-none cursor-pointer ${cls(id)}`
        + " appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center] pr-8";

    const stepLabels = ['Personal','Teaching','Bank','Documents'];

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent 
                showCloseButton={false}
                className="max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0"
            >

                {/* ── Gradient Header ── */}
                <div style={{ background: 'linear-gradient(135deg, #0B1F5B 0%, #1A3278 100%)', borderBottom: '3px solid #F5A623' }}
                    className="px-6 py-4 flex items-center gap-3 flex-shrink-0 relative">
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors p-1"
                        aria-label="Close form"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: '#F5A623', color: '#071544' }}>
                        {['👤','🎓','🏦','📄'][step-1]}
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-[15px]">
                            {['Personal Information','Qualification & Teaching','Bank & Payment Details','Documents & Declaration'][step-1]}
                        </h2>
                        <p className="text-blue-300 text-[11px] pr-8">
                            {['Basic details about the teacher','Academic background and subjects','Required for fee disbursement','Identity verification and consent'][step-1]}
                        </p>
                    </div>
                    {/* Step dots */}
                    <div className="ml-auto flex items-center gap-1.5 mr-6">
                        {[1,2,3,4].map(n => (
                            <div key={n} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                done.has(n) ? 'bg-green-500 text-white'
                                : n === step ? 'bg-amber-400 text-[#071544]'
                                : 'bg-white/10 text-white/50'
                            }`}>
                                {done.has(n) ? '✓' : n}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 bg-[#FFFDF7]">
                    <form ref={formRef} onSubmit={e => e.preventDefault()} className="p-6">

                        {/* ════ STEP 1 ════ */}
                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label req>Full Name</Label>
                                    <input id="mob-fullName" name="fullName" value={formData['fullName'] || ''} onChange={handleChange} type="text" placeholder="e.g. Deepika Kapoor" className={inputCls('fullName')} />
                                    <Err id="fullName" errors={errors} /></div>
                                <div><Label>Alias / Preferred Name</Label>
                                    <input id="mob-alias" name="alias" value={formData['alias'] || ''} onChange={handleChange} type="text" placeholder="e.g. DK Mam" className={inputCls('alias')} /></div>
                                <div><Label req>Gender</Label>
                                    <select id="mob-gender" name="gender" value={formData['gender'] || ''} onChange={handleChange} className={selectCls('gender')}>
                                        <option value="">Select gender</option>
                                        <option>Female</option><option>Male</option><option>Prefer not to say</option>
                                    </select><Err id="gender" errors={errors} /></div>
                                <div><Label req>Date of Birth</Label>
                                    <input id="mob-dob" name="dob" value={formData['dob'] || ''} onChange={handleChange} type="date" className={inputCls('dob')} />
                                    <Err id="dob" errors={errors} /></div>
                                <div><Label req>Mobile Number</Label>
                                    <input id="mob-mobile" name="mobile" value={formData['mobile'] || ''} onChange={handleChange} type="tel" maxLength={10} placeholder="10-digit mobile" className={inputCls('mobile')} />
                                    <Err id="mobile" errors={errors} /></div>
                                <div><Label>WhatsApp <span className="normal-case font-normal text-gray-400">(if different)</span></Label>
                                    <input id="mob-whatsapp" name="whatsapp" value={formData['whatsapp'] || ''} onChange={handleChange} type="tel" maxLength={10} placeholder="WhatsApp number" className={inputCls('whatsapp')} /></div>
                                <div className="col-span-2"><Label req>Email Address</Label>
                                    <input id="mob-email" name="email" value={formData['email'] || ''} onChange={handleChange} type="email" placeholder="teacher@example.com" className={inputCls('email')} />
                                    <Err id="email" errors={errors} /></div>
                                <div className="col-span-2"><Label req>Residential Address</Label>
                                    <textarea id="mob-address" name="address" value={formData['address'] || ''} onChange={handleChange} rows={2} placeholder="Full address with city, state and PIN" className={inputCls('address') + ' resize-none'} />
                                    <Err id="address" errors={errors} /></div>
                                <div><Label req>City</Label>
                                    <input id="mob-city" name="city" value={formData['city'] || ''} onChange={handleChange} type="text" placeholder="City" className={inputCls('city')} />
                                    <Err id="city" errors={errors} /></div>
                                <div><Label req>PIN Code</Label>
                                    <input id="mob-pin" name="pin" value={formData['pin'] || ''} onChange={handleChange} type="text" maxLength={6} placeholder="6-digit PIN" className={inputCls('pin')} />
                                    <Err id="pin" errors={errors} /></div>
                            </div>
                        )}

                        {/* ════ STEP 2 ════ */}
                        {step === 2 && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label req>Highest Qualification</Label>
                                    <select id="mob-qualification" name="qualification" value={formData['qualification'] || ''} onChange={handleChange} className={selectCls('qualification')}>
                                        <option value="">Select</option>
                                        {['B.Sc','B.Tech / B.E.','B.Ed','M.Sc','M.Tech','M.Ed','MBA','Ph.D','Other'].map(q=><option key={q}>{q}</option>)}
                                    </select><Err id="qualification" errors={errors} /></div>
                                <div><Label>Specialisation / Stream</Label>
                                    <input id="mob-stream" name="stream" value={formData['stream'] || ''} onChange={handleChange} type="text" placeholder="e.g. Biology, Physics" className={inputCls('stream')} /></div>
                                <div><Label req>University / College</Label>
                                    <input id="mob-university" name="university" value={formData['university'] || ''} onChange={handleChange} type="text" placeholder="Name of institution" className={inputCls('university')} />
                                    <Err id="university" errors={errors} /></div>
                                <div><Label>Year of Passing</Label>
                                    <input id="mob-passYear" name="passYear" value={formData['passYear'] || ''} onChange={handleChange} type="number" placeholder="e.g. 2018" min={1980} max={2026} className={inputCls('passYear')} /></div>
                                <div><Label req>Teaching Experience</Label>
                                    <select id="mob-experience" name="experience" value={formData['experience'] || ''} onChange={handleChange} className={selectCls('experience')}>
                                        <option value="">Select</option>
                                        {['Less than 1 year','1 – 2 years','3 – 5 years','6 – 10 years','More than 10 years'].map(e=><option key={e}>{e}</option>)}
                                    </select><Err id="experience" errors={errors} /></div>
                                <div><Label req>Mode of Teaching</Label>
                                    <select id="mob-mode" name="mode" value={formData['mode'] || ''} onChange={handleChange} className={selectCls('mode')}>
                                        <option value="">Select</option>
                                        <option>Online Only</option><option>Offline Only</option><option>Both Online & Offline</option>
                                    </select><Err id="mode" errors={errors} /></div>
                                <div className="col-span-2">
                                    <Label req>Subjects You Teach</Label>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {SUBJECTS.map(s => (
                                            <button key={s} type="button"
                                                onClick={() => {
            setFormData((prev: any) => {
                const current = prev.subjects || [];
                const updated = current.includes(s) ? current.filter((x: string) => x !== s) : [...current, s];
                return { ...prev, subjects: updated };
            });
            if (errors.subjects) setErrors((prev: any) => { const e = { ...prev }; delete e.subjects; return e; });
        }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                                    (formData.subjects || []).includes(s)
                                                        ? 'bg-[#0B1F5B] text-white border-[#0B1F5B]'
                                                        : 'bg-[#EDF0FA] text-gray-700 border-[#CDD4ED] hover:border-[#0B1F5B]'
                                                }`}>{s}</button>
                                        ))}
                                    </div>
                                    <Err id="subjects" errors={errors} />
                                </div>
                                <div><Label>Board / Curriculum</Label>
                                    <select id="mob-boards" name="boards" value={formData['boards'] || ''} onChange={handleChange} className={selectCls('boards')}>
                                        <option value="">Select primary board</option>
                                        {['CBSE','ICSE','IB','IGCSE / Cambridge','State Board','JEE / NEET','Multiple Boards'].map(b=><option key={b}>{b}</option>)}
                                    </select></div>
                                <div><Label req>Expected Rate (Rs./hr)</Label>
                                    <input id="mob-rate" name="rate" value={formData['rate'] || ''} onChange={handleChange} type="number" min={100} placeholder="e.g. 400" className={inputCls('rate')} />
                                    <Err id="rate" errors={errors} /></div>
                                <div className="col-span-2"><Label>Previous Institutions / Platforms</Label>
                                    <input id="mob-prevInstitutions" name="prevInstitutions" value={formData['prevInstitutions'] || ''} onChange={handleChange} type="text" placeholder="e.g. Vedantu, FIITJEE" className={inputCls('prevInstitutions')} /></div>
                                <div className="col-span-2"><Label>Short Bio</Label>
                                    <textarea id="mob-bio" name="bio" value={formData['bio'] || ''} onChange={handleChange} rows={2} placeholder="Brief intro about teaching style..." className={inputCls('bio') + ' resize-none'} /></div>
                            </div>
                        )}

                        {/* ════ STEP 3 ════ */}
                        {step === 3 && (
                            <div>
                                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl" style={{ background: 'linear-gradient(135deg,#f0f4ff,#e8f0fe)', border: '1.5px solid #c7d4f8' }}>
                                    <span className="text-lg">🔒</span>
                                    <p className="text-[11px] text-gray-600 leading-relaxed"><strong className="text-[#0B1F5B]">Secure & Confidential.</strong> Bank details are used solely for payment processing by SRV Learning.</p>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>Bank Account</p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div><Label req>Account Holder Name</Label>
                                        <input id="mob-accName" name="accName" value={formData['accName'] || ''} onChange={handleChange} type="text" placeholder="As per bank records" className={inputCls('accName')} />
                                        <Err id="accName" errors={errors} /></div>
                                    <div><Label req>Account Number</Label>
                                        <input id="mob-accNumber" name="accNumber" value={formData['accNumber'] || ''} onChange={handleChange} type="text" placeholder="Bank account number" className={inputCls('accNumber')} />
                                        <Err id="accNumber" errors={errors} /></div>
                                    <div><Label req>Confirm Account No.</Label>
                                        <input id="mob-accConfirm" name="accConfirm" value={formData['accConfirm'] || ''} onChange={handleChange} type="text" placeholder="Re-enter account number" className={inputCls('accConfirm')} />
                                        <Err id="accConfirm" errors={errors} /></div>
                                    <div><Label req>IFSC Code</Label>
                                        <input id="mob-ifsc" name="ifsc" value={formData['ifsc'] || ''} onChange={handleChange} type="text" maxLength={11} placeholder="e.g. SBIN0001234" style={{ textTransform: 'uppercase' }} className={inputCls('ifsc')} />
                                        <Err id="ifsc" errors={errors} /></div>
                                    <div><Label req>Bank Name</Label>
                                        <input id="mob-bankName" name="bankName" value={formData['bankName'] || ''} onChange={handleChange} type="text" placeholder="e.g. State Bank of India" className={inputCls('bankName')} />
                                        <Err id="bankName" errors={errors} /></div>
                                    <div><Label>Branch Name</Label>
                                        <input id="mob-branch" name="branch" value={formData['branch'] || ''} onChange={handleChange} type="text" placeholder="e.g. Lucknow Main Branch" className={inputCls('branch')} /></div>
                                    <div><Label req>Account Type</Label>
                                        <select id="mob-accType" name="accType" value={formData['accType'] || ''} onChange={handleChange} className={selectCls('accType')}>
                                            <option value="">Select type</option>
                                            <option>Savings Account</option><option>Current Account</option>
                                        </select><Err id="accType" errors={errors} /></div>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>UPI Details</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><Label>UPI ID <span className="normal-case font-normal text-gray-400">(Optional but preferred)</span></Label>
                                        <input id="mob-upiId" name="upiId" value={formData['upiId'] || ''} onChange={handleChange} type="text" placeholder="e.g. name@upi or 9876543210@paytm" className={inputCls('upiId')} /></div>
                                    <div><Label req>Preferred Payment Method</Label>
                                        <select id="mob-payMethod" name="payMethod" value={formData['payMethod'] || ''} onChange={handleChange} className={selectCls('payMethod')}>
                                            <option value="">Select</option>
                                            <option>Bank Transfer (NEFT/IMPS)</option><option>UPI</option><option>Both (either is fine)</option>
                                        </select><Err id="payMethod" errors={errors} /></div>
                                    <div><Label>Payment Cycle Preference</Label>
                                        <select id="mob-payCycle" name="payCycle" value={formData['payCycle'] || ''} onChange={handleChange} className={selectCls('payCycle')}>
                                            <option value="">Select</option>
                                            <option>Weekly</option><option>Bi-weekly</option><option>Monthly</option>
                                        </select></div>
                                </div>
                            </div>
                        )}

                        {/* ════ STEP 4 ════ */}
                        {step === 4 && (
                            <div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div><Label req>Aadhaar Number</Label>
                                        <input id="mob-aadhaar" name="aadhaar" value={formData['aadhaar'] || ''} onChange={handleChange} type="text" maxLength={12} placeholder="12-digit Aadhaar" className={inputCls('aadhaar')} />
                                        <Err id="aadhaar" errors={errors} /></div>
                                    <div><Label>PAN Number <span className="normal-case font-normal text-gray-400">(Optional)</span></Label>
                                        <input id="mob-pan" name="pan" value={formData['pan'] || ''} onChange={handleChange} type="text" maxLength={10} placeholder="e.g. ABCDE1234F" style={{ textTransform: 'uppercase' }} className={inputCls('pan')} /></div>
                                    <div><Label req>Emergency Contact Name</Label>
                                        <input id="mob-emergName" name="emergName" value={formData['emergName'] || ''} onChange={handleChange} type="text" placeholder="Contact person name" className={inputCls('emergName')} />
                                        <Err id="emergName" errors={errors} /></div>
                                    <div><Label req>Emergency Contact No.</Label>
                                        <input id="mob-emergPhone" name="emergPhone" value={formData['emergPhone'] || ''} onChange={handleChange} type="tel" maxLength={10} placeholder="10-digit number" className={inputCls('emergPhone')} />
                                        <Err id="emergPhone" errors={errors} /></div>
                                    <div><Label>Relation</Label>
                                        <select id="mob-emergRelation" name="emergRelation" value={formData['emergRelation'] || ''} onChange={handleChange} className={selectCls('emergRelation')}>
                                            <option value="">Select relation</option>
                                            {['Spouse','Parent','Sibling','Friend','Other'].map(r=><option key={r}>{r}</option>)}
                                        </select></div>
                                    <div><Label>Additional Notes</Label>
                                        <input id="mob-notes" name="notes" value={formData['notes'] || ''} onChange={handleChange} type="text" placeholder="Any special requests" className={inputCls('notes')} /></div>
                                </div>

                                {/* Declaration */}
                                <div className="rounded-xl p-3 mb-3 text-[11px] text-gray-600 leading-relaxed" style={{ background: '#EDF0FA' }}>
                                    I hereby declare that all information provided is true and accurate. I agree to abide by SRV Learning&apos;s teaching standards, conduct policies, and payment terms.
                                </div>
                                <div className="flex flex-col gap-2 mb-2">
                                    {[
                                        { id: 'mob-consent1', text: 'I confirm all details provided are accurate and complete', req: true },
                                        { id: 'mob-consent2', text: "I agree to SRV Learning&apos;s Terms & Payment Policy", req: true },
                                        { id: 'mob-consent3', text: 'I consent to my data being stored for payroll purposes', req: false },
                                    ].map(({ id, text, req }) => (
                                        <label key={id} htmlFor={id}
                                            className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border hover:border-[#0B1F5B]/30"
                                            style={{ background: '#EDF0FA', borderColor: '#CDD4ED' }}>
                                            <input type="checkbox" id={id} checked={!!formData[id.replace('mob-', '')]} onChange={handleChange} className="mt-0.5 w-3.5 h-3.5 flex-shrink-0" style={{ accentColor: '#0B1F5B' }} />
                                            <span className="text-[11.5px] font-medium text-gray-700">
                                                {text} {req && <span className="text-amber-500">*</span>}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.consent && <p className="text-[10px] text-red-500 font-medium mb-1">{errors.consent}</p>}
                                {errors.submit && (
                                    <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-[11px] text-red-600 font-medium">⚠️ {errors.submit}</div>
                                )}
                            </div>
                        )}

                    </form>
                </div>

                {/* ── Sticky footer nav ── */}
                <div className="flex items-center justify-between px-6 py-3 border-t bg-white flex-shrink-0">
                    <span className="text-[11px] text-gray-400 font-medium">Step {step} of 4 — {stepLabels[step-1]}</span>
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="outline" size="sm" onClick={back} className="text-xs font-semibold h-8 px-4">
                                ← Back
                            </Button>
                        )}
                        {step < 4 ? (
                            <Button size="sm" className="bg-[#0B1F5B] hover:bg-[#1A3278] text-white text-xs font-semibold h-8 px-5" onClick={next}>
                                Next →
                            </Button>
                        ) : (
                            <Button size="sm"
                                className="bg-amber-400 hover:bg-amber-300 text-[#071544] text-xs font-bold h-8 px-5 shadow-md shadow-amber-200"
                                onClick={submit}
                                disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                                {createMutation.isPending ? 'Submitting...' : '✓ Submit'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const formUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/onboarding/teacher`
        : '/onboarding/teacher';

    function copyLink() {
        navigator.clipboard.writeText(formUrl).then(() => {
            setCopied(true);
            toast.success('Form link copied to clipboard!');
            setTimeout(() => setCopied(false), 3000);
        });
    }

    function shareWhatsApp() {
        const msg = `Fill in this Teacher Onboarding Form for SRV Learning:\n${formUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" /> Share Onboarding Form
                    </DialogTitle>
                    <DialogDescription>
                        Share this link with teachers to fill the onboarding form. No login required.
                    </DialogDescription>
                </DialogHeader>

                {/* Link display */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                    <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{formUrl}</span>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        className={`w-full gap-2 font-semibold transition-all ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'} text-white`}
                        onClick={copyLink}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Form Link'}
                    </Button>
                    <Button
                        className="w-full gap-2 font-semibold text-white"
                        style={{ background: '#25D366' }}
                        onClick={shareWhatsApp}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Share on WhatsApp
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}


const Section = ({ title, icon }: { title: string; icon: string }) => (
    <div className="flex items-center gap-2 mt-5 mb-3">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        <div className="flex-1 h-px bg-border" />
    </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string | number | string[] }) => {
    const display = Array.isArray(value) ? value.join(', ') : (value || '—');
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground">{String(display)}</span>
        </div>
    );
};

// ─── Detail View Modal ─────────────────────────────────────────────────────────
function DetailModal({ record, open, onClose }: { record: TeacherOnboarding | null; open: boolean; onClose: () => void }) {
    const updateMutation = useUpdateOnboarding(record?._id || '');
    const [localStatus, setLocalStatus] = useState<TeacherOnboarding['status']>(record?.status || 'pending');

    useEffect(() => { if (record) setLocalStatus(record.status); }, [record]);

    async function handleStatusChange(newStatus: string | null) {
        if (!record || !newStatus) return;
        try {
            await updateMutation.mutateAsync({ status: newStatus as TeacherOnboarding['status'] });
            setLocalStatus(newStatus as TeacherOnboarding['status']);
            toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label}`);
        } catch {
            toast.error('Failed to update status');
        }
    }

    if (!record) return null;
    const maskAcc = (a: string) => a ? a.slice(0, 2) + '•'.repeat(Math.max(0, a.length - 5)) + a.slice(-3) : '—';

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {record.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold">{record.fullName}</div>
                            <div className="text-xs text-muted-foreground font-normal">{record.email}</div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Status control */}
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                    <StatusBadge status={localStatus} />
                    <div className="ml-auto">
                        <Select value={localStatus} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
                            <SelectTrigger className="h-8 text-xs w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Section title="Personal Information" icon="👤" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoRow label="Full Name" value={record.fullName} />
                    <InfoRow label="Alias" value={record.alias} />
                    <InfoRow label="Gender" value={record.gender} />
                    <InfoRow label="Date of Birth" value={record.dob ? format(new Date(record.dob), 'dd MMM yyyy') : '—'} />
                    <InfoRow label="Mobile" value={record.mobile} />
                    <InfoRow label="WhatsApp" value={record.whatsapp} />
                    <InfoRow label="Email" value={record.email} />
                    <InfoRow label="City / PIN" value={`${record.city} — ${record.pin}`} />
                    <div className="col-span-2">
                        <InfoRow label="Address" value={record.address} />
                    </div>
                </div>

                <Section title="Qualification & Teaching" icon="🎓" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoRow label="Qualification" value={record.qualification} />
                    <InfoRow label="Stream" value={record.stream} />
                    <InfoRow label="University" value={record.university} />
                    <InfoRow label="Year of Passing" value={record.passYear} />
                    <InfoRow label="Experience" value={record.experience} />
                    <InfoRow label="Mode" value={record.mode} />
                    <InfoRow label="Board" value={record.boards} />
                    <InfoRow label="Rate" value={`Rs.${record.rate}/hr`} />
                    <div className="col-span-2">
                        <InfoRow label="Subjects" value={record.subjects} />
                    </div>
                    <div className="col-span-2">
                        <InfoRow label="Previous Institutions" value={record.prevInstitutions} />
                    </div>
                    <div className="col-span-2">
                        <InfoRow label="Bio" value={record.bio} />
                    </div>
                </div>

                <Section title="Bank & Payment" icon="🏦" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoRow label="Account Holder" value={record.accName} />
                    <InfoRow label="Account Number" value={record.accNumber} />
                    <InfoRow label="IFSC Code" value={record.ifsc} />
                    <InfoRow label="Bank Name" value={record.bankName} />
                    <InfoRow label="Branch" value={record.branch} />
                    <InfoRow label="Account Type" value={record.accType} />
                    <InfoRow label="UPI ID" value={record.upiId} />
                    <InfoRow label="Payment Method" value={record.payMethod} />
                    <InfoRow label="Payment Cycle" value={record.payCycle} />
                </div>

                <Section title="Documents & Emergency" icon="📄" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoRow label="Aadhaar" value={record.aadhaar} />
                    <InfoRow label="PAN" value={record.pan} />
                    <InfoRow label="Emergency Contact" value={record.emergName} />
                    <InfoRow label="Emergency Phone" value={record.emergPhone} />
                    <InfoRow label="Relation" value={record.emergRelation} />
                    <InfoRow label="Notes" value={record.notes} />
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                    <InfoRow label="Submitted At" value={record.createdAt ? format(new Date(record.createdAt), 'dd MMM yyyy, hh:mm a') : '—'} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherOnboardingListPage() {
    const { user } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [viewRecord, setViewRecord] = useState<TeacherOnboarding | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<TeacherOnboarding | null>(null);

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(value);
            setPage(1);
        }, 400);
    }, []);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const { data, isLoading, isError, error } = useOnboardings({
        search: search || undefined,
        status: statusFilter || undefined,
        page: String(page),
        limit: String(limit),
    });

    const deleteMutation = useDeleteOnboarding();

    async function handleDelete() {
        if (!deleteRecord) return;
        try {
            await deleteMutation.mutateAsync(deleteRecord._id);
            setDeleteRecord(null);
            toast.success(`${deleteRecord.fullName}'s record deleted`);
        } catch {
            toast.error('Failed to delete record');
        }
    }

    const records = data?.onboardings ?? [];

    // Stats
    const stats = records.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
    if (isError) return (
        <div className="flex items-center justify-center py-20 gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{(error as Error).message}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Teacher Onboarding</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                        {data?.pagination?.total ?? records.length} submission{(data?.pagination?.total ?? records.length) !== 1 ? 's' : ''}
                        {data?.pagination && ` · showing ${data.pagination.from}–${data.pagination.to}`}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative w-60">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search name, email, city..."
                            className="pl-8 h-9 text-xs bg-muted/20 border-border/50"
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Status filter */}
                    <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
                        <SelectTrigger className="h-9 text-xs w-32">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">All Status</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Share button */}
                    <Button
                        variant="outline"
                        className="gap-2 h-9 px-4 text-xs font-semibold border-border"
                        onClick={() => setShareModalOpen(true)}
                    >
                        <Share2 className="w-3.5 h-3.5" /> Share Form
                    </Button>

                    {/* Add button */}
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white gap-2 h-9 px-4 text-xs font-semibold"
                        onClick={() => setAddModalOpen(true)}
                    >
                        <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = data?.onboardings?.filter(r => r.status === key).length ?? 0;
                    return (
                        <Card key={key} className="shadow-sm border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter(statusFilter === key ? '' : key)}>
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${cfg.color}`}>
                                    {count}
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">{cfg.label}</span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Table */}
            <Card className="shadow-sm bg-card border border-border overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" /> Onboarding Submissions
                    </CardTitle>
                </CardHeader>
                <div className="w-full overflow-x-auto">
                    <Table className="min-w-[900px] text-sm">
                        <TableHeader>
                            <TableRow className="bg-muted/80 hover:bg-muted/80 border-b border-border sticky top-0 z-10">
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Teacher</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Contact</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Subjects</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Qualification</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-center">Rate / hr</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Submitted</TableHead>
                                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                                            <ClipboardList className="w-10 h-10 opacity-20" />
                                            <div>
                                                <p className="text-sm font-semibold">No submissions yet</p>
                                                <p className="text-xs mt-1 opacity-60">Share the form link with teachers to get started</p>
                                            </div>
                                            <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => setShareModalOpen(true)}>
                                                <Share2 className="w-3.5 h-3.5" /> Share Form
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records.map((record) => (
                                    <TableRow key={record._id} className="border-b border-border/40 hover:bg-accent/50 transition-colors">
                                        {/* Teacher */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                        {record.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <button 
                                                        onClick={() => setViewRecord(record)}
                                                        className="font-semibold text-sm truncate text-left hover:text-blue-600 transition-colors cursor-pointer underline"
                                                    >
                                                        {record.fullName}
                                                    </button>
                                                    {record.alias && <span className="text-[10px] text-muted-foreground">{record.alias}</span>}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Contact */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-medium truncate">{record.email}</span>
                                                <span className="text-[10px] text-muted-foreground">{record.mobile} · {record.city}</span>
                                            </div>
                                        </TableCell>

                                        {/* Subjects */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(record.subjects ?? []).map(s => (
                                                    <Badge key={s} className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 border-0 px-1.5">{s}</Badge>
                                                ))}
                                                {(record.subjects ?? []).length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                                            </div>
                                        </TableCell>

                                        {/* Qualification */}
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium">{record.qualification}</span>
                                                <span className="text-[10px] text-muted-foreground">{record.experience}</span>
                                            </div>
                                        </TableCell>

                                        {/* Rate */}
                                        <TableCell className="px-4 py-3 text-center">
                                            <span className="text-sm font-bold text-emerald-600">₹{record.rate}</span>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="px-4 py-3">
                                            <StatusBadge status={record.status} />
                                        </TableCell>

                                        {/* Submitted */}
                                        <TableCell className="px-4 py-3">
                                            <span className="text-xs text-muted-foreground">
                                                {record.createdAt ? format(new Date(record.createdAt), 'dd MMM yyyy') : '—'}
                                            </span>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                                    onClick={() => setViewRecord(record)}
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center hover:bg-muted rounded-md transition-colors outline-none text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem onClick={() => setViewRecord(record)} className="cursor-pointer gap-2">
                                                            <Eye className="w-3.5 h-3.5" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteRecord(record)}
                                                            className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete Record
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {data?.pagination && (
                    <Pagination
                        currentPage={data.pagination.page}
                        totalPages={data.pagination.totalPages}
                        onPageChange={setPage}
                        from={data.pagination.from}
                        to={data.pagination.to}
                        total={data.pagination.total}
                    />
                )}
            </Card>

            {/* Share Modal */}
            <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />

            {/* Add Onboarding Modal */}
            <AddOnboardingModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

            {/* Detail Modal */}
            <DetailModal record={viewRecord} open={!!viewRecord} onClose={() => setViewRecord(null)} />

            {/* Delete Confirmation */}
            <Dialog open={!!deleteRecord} onOpenChange={(o) => !o && setDeleteRecord(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" /> Delete Record?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete <strong className="text-foreground">{deleteRecord?.fullName}</strong>&apos;s onboarding record?
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setDeleteRecord(null)} className="font-semibold">Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-lg shadow-red-500/20"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Permanently
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
