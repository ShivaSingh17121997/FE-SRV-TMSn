'use client';

import { useState, useRef, useEffect } from 'react';
import { useCreateOnboarding } from '@/lib/hooks/useOnboarding';
import type { CreateOnboardingPayload } from '@/lib/hooks/useOnboarding';

// ─── Helpers ──────────────────────────────────────────────────────────────────


const SUBJECTS = [
    'Physics', 'Chemistry', 'Biology', 'Mathematics', 'English',
    'Hindi', 'History', 'Geography', 'Economics', 'Accountancy',
    'Computer Sc.', 'Sanskrit', 'Political Sc.', 'Psychology', 'Other',
];

type Step = 1 | 2 | 3 | 4;

interface FieldErrors {
    [key: string]: string;
}

// ─── Error field helper ────────────────────────────────────────────────────
function Field({ id, label, required, tip, children, error }: {
    id?: string; label: string; required?: boolean; tip?: string; children: React.ReactNode; error?: string;
}) {
    return (
        <div className="field">
            <label htmlFor={id}>
                {label} {required && <span className="req">*</span>}
                {tip && <span className="tip">{tip}</span>}
            </label>
            {children}
            {error && <span className="err-msg show">{error}</span>}
        </div>
    );
}

export default function TeacherOnboardingPage() {
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [formData, setFormData] = useState<any>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('teacherOnboardingData');
        if (saved) {
            try { setFormData(JSON.parse(saved)); } catch (e) {}
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('teacherOnboardingData', JSON.stringify(formData));
        }
    }, [formData, isLoaded]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target as HTMLInputElement;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
        if (errors[id]) {
            setErrors((prev: any) => { const newErr = { ...prev }; delete newErr[id]; return newErr; });
        }
    };

    // completedSteps is dynamic
    const completedSteps = new Set<number>();
    for (let i = 1; i < currentStep; i++) completedSteps.add(i);
    const [errors, setErrors] = useState<FieldErrors>({});
    // selectedSubjects is derived from formData
    const selectedSubjects: string[] = formData.subjects || [];
    const [submitted, setSubmitted] = useState(false);
    const [submittedData, setSubmittedData] = useState<Partial<CreateOnboardingPayload> | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const createOnboarding = useCreateOnboarding();

    // ─── Validation ────────────────────────────────────────────────────────────
    function validate(step: Step): boolean {
        const v = (id: string) => typeof formData[id] === 'string' ? formData[id].trim() : (formData[id] || '');
        const errs: FieldErrors = {};
        if (step === 1) {
            if (!v('fullName')) errs.fullName = 'Please enter full name';
            if (!v('gender')) errs.gender = 'Please select gender';
            if (!v('dob')) errs.dob = 'Please enter date of birth';
            if (!/^\d{10}$/.test(v('mobile'))) errs.mobile = 'Enter valid 10-digit mobile';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errs.email = 'Enter a valid email';
            if (!v('address')) errs.address = 'Please enter address';
            if (!v('city')) errs.city = 'Please enter city';
            if (!/^\d{6}$/.test(v('pin'))) errs.pin = 'Enter valid 6-digit PIN';
        }
        if (step === 2) {
            if (!v('qualification')) errs.qualification = 'Please select qualification';
            if (!v('university')) errs.university = 'Please enter university';
            if (!v('experience')) errs.experience = 'Please select experience';
            if (!v('mode')) errs.mode = 'Please select mode';
            if (!v('rate')) errs.rate = 'Please enter rate';
            if (selectedSubjects.length === 0) errs.subjects = 'Please select at least one subject';
        }
        if (step === 3) {
            if (!v('accName')) errs.accName = 'Please enter holder name';
            if (!v('accNumber')) errs.accNumber = 'Please enter account number';
            if (v('accNumber') !== v('accConfirm')) errs.accConfirm = v('accConfirm') ? 'Account numbers do not match' : 'Please confirm account number';
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v('ifsc'))) errs.ifsc = 'Enter valid IFSC code';
            if (!v('bankName')) errs.bankName = 'Please enter bank name';
            if (!v('accType')) errs.accType = 'Please select account type';
            if (!v('payMethod')) errs.payMethod = 'Please select payment method';
        }
        if (step === 4) {
            if (!/^\d{12}$/.test(v('aadhaar'))) errs.aadhaar = 'Enter valid 12-digit Aadhaar';
            if (!v('emergName')) errs.emergName = 'Please enter emergency contact';
            if (!/^\d{10}$/.test(v('emergPhone'))) errs.emergPhone = 'Enter valid 10-digit number';
            const c1 = formData.consent1;
            const c2 = formData.consent2;
            if (!c1 || !c2) errs.consent = 'Please accept the required declarations';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function nextStep() {
        if (!validate(currentStep)) return;
        
        setCurrentStep((s) => (s + 1) as Step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function prevStep() {
        setCurrentStep((s) => (s - 1) as Step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleSubject(subject: string) {
        setFormData((prev: any) => {
            const current = prev.subjects || [];
            const updated = current.includes(subject) ? current.filter((s: string) => s !== subject) : [...current, subject];
            return { ...prev, subjects: updated };
        });
        if (errors.subjects) setErrors((prev: any) => { const e = { ...prev }; delete e.subjects; return e; });
    }

    async function handleSubmit() {
        const v = (id: string) => typeof formData[id] === 'string' ? formData[id].trim() : (formData[id] || '');
        if (!validate(4)) return;

        const payload: CreateOnboardingPayload = {
            fullName: v('fullName'), alias: v('alias'), gender: v('gender') as any,
            dob: v('dob'), mobile: v('mobile'), whatsapp: v('whatsapp'), email: v('email'),
            address: v('address'), city: v('city'), pin: v('pin'),
            qualification: v('qualification'), stream: v('stream'), university: v('university'),
            passYear: v('passYear') ? Number(v('passYear')) : undefined,
            experience: v('experience'), mode: v('mode'), subjects: selectedSubjects,
            boards: v('boards'), rate: Number(v('rate')), prevInstitutions: v('prevInstitutions'), bio: v('bio'),
            accName: v('accName'), accNumber: v('accNumber'), ifsc: v('ifsc').toUpperCase(),
            bankName: v('bankName'), branch: v('branch'), accType: v('accType') as any,
            upiId: v('upiId'), payMethod: v('payMethod'), payCycle: v('payCycle'),
            aadhaar: v('aadhaar'), pan: v('pan').toUpperCase() || undefined,
            emergName: v('emergName'), emergPhone: v('emergPhone'),
            emergRelation: v('emergRelation'), notes: v('notes'),
        };

        try {
            await createOnboarding.mutateAsync(payload);
            setSubmittedData(payload);
            setSubmitted(true);
            localStorage.removeItem('teacherOnboardingData');
        } catch (err) {
            setErrors({ submit: err instanceof Error ? err.message : 'Submission failed. Please try again.' });
        }
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `Fill in this Teacher Onboarding Form for SRV Learning:\n${shareUrl}`;

    function copyLink() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);
        });
    }

    function shareWhatsApp() {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }

    const maskAcc = (a: string) => a ? a.slice(0, 2) + '•'.repeat(Math.max(0, a.length - 5)) + a.slice(-3) : '—';

    // ─── Step dot status helper ────────────────────────────────────────────────
    function dotClass(step: number) {
        if (completedSteps.has(step)) return 'step-dot done';
        if (step === currentStep) return 'step-dot active';
        return 'step-dot';
    }
    function lineClass(step: number) {
        return `step-line${completedSteps.has(step) ? ' done' : ''}`;
    }



    // ─── Render ───────────────────────────────────────────────────────────────
    if (!isLoaded) return null;
    return (
        <>
            <style>{`
                :root {
                    --navy: #0B1F5B; --navy-dk: #071544; --navy-md: #1A3278;
                    --amber: #F5A623; --amber-l: #FFC85C;
                    --cream: #FFFDF7; --slate: #EDF0FA; --steel: #8A97B8;
                    --charcoal: #2D3A5A; --mid: #CDD4ED;
                    --success: #16A34A; --error: #DC2626;
                }
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: var(--navy-dk); min-height: 100vh; padding: 36px 16px 60px; }

                /* Bg decoration */
                .ob-bg::before { content:''; position:fixed; inset:0; background-image:repeating-linear-gradient(135deg,transparent,transparent 40px,rgba(255,255,255,0.015) 40px,rgba(255,255,255,0.015) 41px); pointer-events:none; z-index:0; }
                .ob-bg::after { content:''; position:fixed; top:-120px; right:-120px; width:400px; height:400px; background:radial-gradient(circle,rgba(245,166,35,0.15) 0%,transparent 70%); pointer-events:none; z-index:0; }

                .wrapper { width:100%; max-width:780px; margin:0 auto; position:relative; z-index:1; animation:fadeUp 0.6s ease both; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }

                /* Header */
                .ob-header { text-align:center; margin-bottom:28px; }
                .logo-badge { display:inline-flex; align-items:center; gap:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(245,166,35,0.3); border-radius:50px; padding:8px 20px 8px 8px; margin-bottom:24px; }
                .logo-circle { width:38px; height:38px; background:var(--amber); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:var(--navy-dk); }
                .logo-text { font-weight:600; font-size:13px; color:white; }
                .logo-text span { color:var(--amber-l); }
                .ob-header h1 { font-size:clamp(24px,5vw,36px); color:white; line-height:1.2; margin-bottom:8px; font-weight:700; }
                .ob-header h1 em { color:var(--amber); font-style:normal; }
                .ob-header p { color:var(--steel); font-size:13.5px; font-weight:300; }

                /* Progress */
                .progress-track { display:flex; align-items:center; justify-content:center; margin:24px 0 28px; }
                .step-dot { display:flex; flex-direction:column; align-items:center; gap:6px; }
                .step-dot .dot { width:34px; height:34px; border-radius:50%; background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:var(--steel); transition:all 0.3s ease; }
                .step-dot.active .dot { background:var(--amber); border-color:var(--amber); color:var(--navy-dk); box-shadow:0 0 18px rgba(245,166,35,0.4); }
                .step-dot.done .dot { background:var(--success); border-color:var(--success); color:white; }
                .step-dot .label { font-size:9.5px; font-weight:500; color:var(--steel); text-transform:uppercase; letter-spacing:0.8px; white-space:nowrap; }
                .step-dot.active .label { color:var(--amber-l); }
                .step-dot.done .label { color:#4ade80; }
                .step-line { width:55px; height:2px; background:rgba(255,255,255,0.1); margin-bottom:18px; position:relative; overflow:hidden; }
                .step-line.done::after { content:''; position:absolute; inset:0; background:var(--success); }

                /* Card */
                .card { background:var(--cream); border-radius:20px; overflow:hidden; box-shadow:0 32px 64px rgba(0,0,0,0.4); }
                .card-header { background:var(--navy); padding:18px 28px; display:flex; align-items:center; gap:14px; border-bottom:3px solid var(--amber); }
                .section-icon { width:40px; height:40px; background:var(--amber); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
                .card-header-text h2 { font-size:17px; color:white; margin-bottom:2px; font-weight:700; }
                .card-header-text p { font-size:11.5px; color:var(--steel); font-weight:300; }
                .card-body { padding:26px 28px 30px; }

                /* Form */
                .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
                .span2 { grid-column:1/-1; }
                .field { display:flex; flex-direction:column; gap:5px; }
                label { font-size:11px; font-weight:600; color:var(--charcoal); text-transform:uppercase; letter-spacing:0.8px; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
                label .req { color:var(--amber); font-size:13px; }
                label .tip { font-size:9.5px; font-weight:400; color:var(--steel); text-transform:none; letter-spacing:0; background:var(--slate); padding:2px 7px; border-radius:20px; }
                input, select, textarea { font-family:'DM Sans',sans-serif; font-size:13.5px; color:var(--navy); background:white; border:1.5px solid var(--mid); border-radius:10px; padding:10px 13px; outline:none; width:100%; transition:border-color 0.2s,box-shadow 0.2s; }
                input:focus, select:focus, textarea:focus { border-color:var(--navy); box-shadow:0 0 0 3px rgba(11,31,91,0.08); }
                input.has-error, select.has-error, textarea.has-error { border-color:var(--error); }
                input.valid { border-color:var(--success); }
                .err-msg { font-size:10.5px; color:var(--error); font-weight:500; display:none; }
                .err-msg.show { display:block; }
                textarea { resize:vertical; min-height:76px; }
                select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238A97B8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }

                /* Chips */
                .checkbox-grid { display:flex; flex-wrap:wrap; gap:7px; }
                .check-chip { display:flex; align-items:center; gap:6px; background:var(--slate); border:1.5px solid var(--mid); border-radius:8px; padding:6px 11px; cursor:pointer; transition:all 0.2s; user-select:none; }
                .check-chip.selected { background:var(--navy); border-color:var(--navy); }
                .check-chip span { font-size:11.5px; font-weight:500; color:var(--charcoal); transition:color 0.2s; }
                .check-chip.selected span { color:white; }
                .consent-chip { display:flex; align-items:flex-start; gap:10px; background:var(--slate); border:1.5px solid var(--mid); border-radius:10px; padding:11px 13px; cursor:pointer; transition:all 0.2s; user-select:none; }
                .consent-chip.selected { background:var(--navy); border-color:var(--navy); }
                .consent-chip input { flex-shrink:0; margin-top:2px; }
                .consent-chip span { font-size:12px; font-weight:500; color:var(--charcoal); transition:color 0.2s; line-height:1.5; }
                .consent-chip.selected span { color:white; }

                /* Divider */
                .section-divider { display:flex; align-items:center; gap:10px; margin:24px 0 18px; }
                .section-divider .line { flex:1; height:1px; background:var(--mid); }
                .section-divider .title { font-size:10px; font-weight:700; color:var(--steel); text-transform:uppercase; letter-spacing:1.2px; display:flex; align-items:center; gap:6px; }
                .section-divider .sdot { width:6px; height:6px; background:var(--amber); border-radius:50%; }

                /* Bank box */
                .bank-box { background:linear-gradient(135deg,#f0f4ff,#e8f0fe); border:1.5px solid #c7d4f8; border-radius:12px; padding:14px 18px; margin-bottom:18px; display:flex; align-items:flex-start; gap:12px; }
                .bank-box .bicon { font-size:20px; flex-shrink:0; margin-top:2px; }
                .bank-box p { font-size:12px; color:var(--charcoal); line-height:1.5; }
                .bank-box strong { color:var(--navy); }

                /* Declaration box */
                .decl-box { background:var(--slate); border-radius:12px; padding:14px 16px; margin-bottom:16px; font-size:12px; color:var(--charcoal); line-height:1.7; }

                /* Nav */
                .nav-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:24px; padding-top:18px; border-top:1px solid var(--mid); }
                .btn { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; border:none; border-radius:10px; padding:12px 26px; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; }
                .btn:disabled { opacity:0.6; cursor:not-allowed; transform:none!important; }
                .btn-secondary { background:var(--slate); color:var(--charcoal); border:1.5px solid var(--mid); }
                .btn-secondary:hover { background:var(--mid); }
                .btn-primary { background:var(--navy); color:white; box-shadow:0 4px 14px rgba(11,31,91,0.3); }
                .btn-primary:hover:not(:disabled) { background:var(--navy-md); transform:translateY(-1px); }
                .btn-amber { background:var(--amber); color:var(--navy-dk); box-shadow:0 4px 14px rgba(245,166,35,0.35); }
                .btn-amber:hover:not(:disabled) { background:var(--amber-l); transform:translateY(-1px); }
                .btn-green { background:#16A34A; color:white; box-shadow:0 4px 14px rgba(22,163,74,0.3); }
                .btn-green:hover { background:#15803d; transform:translateY(-1px); }

                /* Global error */
                .global-err { background:#fef2f2; border:1.5px solid #fca5a5; border-radius:10px; padding:12px 16px; font-size:12.5px; color:var(--error); margin-bottom:16px; font-weight:500; }

                /* Success */
                .success-screen { padding:44px 28px; text-align:center; }
                .success-circle { width:76px; height:76px; background:linear-gradient(135deg,#16A34A,#22c55e); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:34px; margin:0 auto 20px; box-shadow:0 8px 24px rgba(22,163,74,0.3); animation:popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
                @keyframes popIn { from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1} }
                .success-screen h2 { font-size:24px; color:var(--navy); margin-bottom:8px; font-weight:700; }
                .success-screen p { color:var(--steel); font-size:13.5px; margin-bottom:24px; }
                .summary-grid { background:var(--slate); border-radius:14px; padding:18px; text-align:left; margin:18px 0; display:grid; grid-template-columns:1fr 1fr; gap:13px; }
                .summary-item .key { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--steel); margin-bottom:2px; }
                .summary-item .val { font-size:12.5px; font-weight:600; color:var(--navy); }
                .share-row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:16px; }
                .share-btn { background:var(--navy); color:white; border:none; border-radius:10px; padding:11px 22px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s; }
                .share-btn:hover { background:var(--navy-md); }
                .share-btn.whatsapp { background:#25D366; }
                .share-btn.whatsapp:hover { background:#1ebe5d; }
                .share-btn.copy.copied { background:var(--success); }

                /* Spinner */
                .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
                @keyframes spin { to{transform:rotate(360deg)} }

                @media(max-width:560px) {
                    .card-body,.card-header { padding:18px 16px; }
                    .form-grid { grid-template-columns:1fr; }
                    .span2 { grid-column:1; }
                    .step-line { width:28px; }
                    .summary-grid { grid-template-columns:1fr; }
                }
            `}</style>

            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

            <div className="ob-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

            <div className="wrapper">

                {/* Header */}
                <div className="ob-header">
                    <div className="logo-badge">
                        <div className="logo-circle">SRV</div>
                        <div className="logo-text">SRV Learning &nbsp;|&nbsp; <span>Teacher Portal</span></div>
                    </div>
                    <h1>Teacher <em>Onboarding</em> Form</h1>
                    <p>Complete all sections to register as an SRV Learning faculty member</p>
                </div>

                {/* Progress */}
                {!submitted && (
                    <div className="progress-track">
                        {[1, 2, 3, 4].map((step, idx) => (
                            <>
                                <div key={step} className={dotClass(step)}>
                                    <div className="dot">{completedSteps.has(step) ? '✓' : step}</div>
                                    <div className="label">{['Personal', 'Teaching', 'Bank', 'Documents'][idx]}</div>
                                </div>
                                {idx < 3 && <div key={`line-${step}`} className={lineClass(step)} />}
                            </>
                        ))}
                    </div>
                )}

                <div className="card">
                    <form ref={formRef} onSubmit={(e) => e.preventDefault()}>

                        {/* ── Step 1: Personal ───────────────────────────────────────────── */}
                        {currentStep === 1 && !submitted && (
                            <>
                                <div className="card-header">
                                    <div className="section-icon">👤</div>
                                    <div className="card-header-text"><h2>Personal Information</h2><p>Basic details about the teacher</p></div>
                                </div>
                                <div className="card-body">
                                    <div className="form-grid">
                                        <Field id="fullName" label="Full Name" required error={errors.fullName}>
                                            <input id="fullName" name="fullName" value={formData['fullName'] || ''} onChange={handleChange} type="text" placeholder="e.g. Deepika Kapoor" className={errors.fullName ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="alias" label="Alias / Preferred Name">
                                            <input id="alias" name="alias" value={formData['alias'] || ''} onChange={handleChange} type="text" placeholder="e.g. DK Mam" />
                                        </Field>
                                        <Field id="gender" label="Gender" required error={errors.gender}>
                                            <select id="gender" name="gender" value={formData['gender'] || ''} onChange={handleChange} className={errors.gender ? 'has-error' : ''}>
                                                <option value="">Select gender</option>
                                                <option>Female</option><option>Male</option><option>Prefer not to say</option>
                                            </select>
                                        </Field>
                                        <Field id="dob" label="Date of Birth" required error={errors.dob}>
                                            <input id="dob" name="dob" value={formData['dob'] || ''} onChange={handleChange} type="date" className={errors.dob ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="mobile" label="Mobile Number" required error={errors.mobile}>
                                            <input id="mobile" name="mobile" value={formData['mobile'] || ''} onChange={handleChange} type="tel" placeholder="10-digit mobile" maxLength={10} className={errors.mobile ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="whatsapp" label="WhatsApp" tip="If different">
                                            <input id="whatsapp" name="whatsapp" value={formData['whatsapp'] || ''} onChange={handleChange} type="tel" placeholder="WhatsApp number" maxLength={10} />
                                        </Field>
                                        <div className="field span2">
                                            <label htmlFor="email">Email Address <span className="req">*</span></label>
                                            <input id="email" name="email" value={formData['email'] || ''} onChange={handleChange} type="email" placeholder="teacher@example.com" className={errors.email ? 'has-error' : ''} />
                                            {errors.email && <span className="err-msg show">{errors.email}</span>}
                                        </div>
                                        <div className="field span2">
                                            <label htmlFor="address">Residential Address <span className="req">*</span></label>
                                            <textarea id="address" name="address" value={formData['address'] || ''} onChange={handleChange} placeholder="Full address with city, state and PIN code" className={errors.address ? 'has-error' : ''} />
                                            {errors.address && <span className="err-msg show">{errors.address}</span>}
                                        </div>
                                        <Field id="city" label="City" required error={errors.city}>
                                            <input id="city" name="city" value={formData['city'] || ''} onChange={handleChange} type="text" placeholder="City" className={errors.city ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="pin" label="PIN Code" required error={errors.pin}>
                                            <input id="pin" name="pin" value={formData['pin'] || ''} onChange={handleChange} type="text" placeholder="6-digit PIN" maxLength={6} className={errors.pin ? 'has-error' : ''} />
                                        </Field>
                                    </div>
                                    <div className="nav-row">
                                        <span style={{ color: 'var(--steel)', fontSize: '12px' }}>Step 1 of 4</span>
                                        <button type="button" className="btn btn-primary" onClick={nextStep}>Next →</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 2: Teaching ───────────────────────────────────────────── */}
                        {currentStep === 2 && !submitted && (
                            <>
                                <div className="card-header">
                                    <div className="section-icon">🎓</div>
                                    <div className="card-header-text"><h2>Qualification & Teaching</h2><p>Academic background and subjects</p></div>
                                </div>
                                <div className="card-body">
                                    <div className="form-grid">
                                        <Field id="qualification" label="Highest Qualification" required error={errors.qualification}>
                                            <select id="qualification" name="qualification" value={formData['qualification'] || ''} onChange={handleChange} className={errors.qualification ? 'has-error' : ''}>
                                                <option value="">Select</option>
                                                {['B.Sc','B.Tech / B.E.','B.Ed','M.Sc','M.Tech','M.Ed','MBA','Ph.D','Other'].map(q => <option key={q}>{q}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="stream" label="Specialisation / Stream">
                                            <input id="stream" name="stream" value={formData['stream'] || ''} onChange={handleChange} type="text" placeholder="e.g. Biology, Physics" />
                                        </Field>
                                        <Field id="university" label="University / College" required error={errors.university}>
                                            <input id="university" name="university" value={formData['university'] || ''} onChange={handleChange} type="text" placeholder="Name of institution" className={errors.university ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="passYear" label="Year of Passing">
                                            <input id="passYear" name="passYear" value={formData['passYear'] || ''} onChange={handleChange} type="number" placeholder="e.g. 2018" min={1980} max={2026} />
                                        </Field>
                                        <Field id="experience" label="Teaching Experience" required error={errors.experience}>
                                            <select id="experience" name="experience" value={formData['experience'] || ''} onChange={handleChange} className={errors.experience ? 'has-error' : ''}>
                                                <option value="">Select</option>
                                                {['Less than 1 year','1 – 2 years','3 – 5 years','6 – 10 years','More than 10 years'].map(e => <option key={e}>{e}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="mode" label="Mode of Teaching" required error={errors.mode}>
                                            <select id="mode" name="mode" value={formData['mode'] || ''} onChange={handleChange} className={errors.mode ? 'has-error' : ''}>
                                                <option value="">Select</option>
                                                <option>Online Only</option><option>Offline Only</option><option>Both Online & Offline</option>
                                            </select>
                                        </Field>
                                        <div className="field span2">
                                            <label>Subjects You Teach <span className="req">*</span> <span className="tip">Select all that apply</span></label>
                                            <div className="checkbox-grid">
                                                {SUBJECTS.map(s => (
                                                    <label key={s} className={`check-chip${selectedSubjects.includes(s) ? ' selected' : ''}`} onClick={() => toggleSubject(s)}>
                                                        <span>{s}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {errors.subjects && <span className="err-msg show">{errors.subjects}</span>}
                                        </div>
                                        <Field id="boards" label="Board / Curriculum">
                                            <select id="boards" name="boards" value={formData['boards'] || ''} onChange={handleChange}>
                                                <option value="">Select primary board</option>
                                                {['CBSE','ICSE','IB','IGCSE / Cambridge','State Board','JEE / NEET','Multiple Boards'].map(b => <option key={b}>{b}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="rate" label="Expected Rate (Rs./hr)" required error={errors.rate}>
                                            <input id="rate" name="rate" value={formData['rate'] || ''} onChange={handleChange} type="number" placeholder="e.g. 400" min={100} className={errors.rate ? 'has-error' : ''} />
                                        </Field>
                                        <div className="field span2">
                                            <label htmlFor="prevInstitutions">Previous Institutions / Platforms</label>
                                            <input id="prevInstitutions" name="prevInstitutions" value={formData['prevInstitutions'] || ''} onChange={handleChange} type="text" placeholder="e.g. Vedantu, FIITJEE, Private Coaching" />
                                        </div>
                                        <div className="field span2">
                                            <label htmlFor="bio">Short Bio <span className="tip">For student profile</span></label>
                                            <textarea id="bio" name="bio" value={formData['bio'] || ''} onChange={handleChange} placeholder="Brief introduction about your teaching style and experience..." />
                                        </div>
                                    </div>
                                    <div className="nav-row">
                                        <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                        <button type="button" className="btn btn-primary" onClick={nextStep}>Next →</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 3: Bank ───────────────────────────────────────────────── */}
                        {currentStep === 3 && !submitted && (
                            <>
                                <div className="card-header">
                                    <div className="section-icon">🏦</div>
                                    <div className="card-header-text"><h2>Bank & Payment Details</h2><p>Required for fee disbursement</p></div>
                                </div>
                                <div className="card-body">
                                    <div className="bank-box">
                                        <div className="bicon">🔒</div>
                                        <p><strong>Secure & Confidential.</strong> Bank details are used solely for payment processing by SRV Learning and stored securely.</p>
                                    </div>
                                    <div className="section-divider"><div className="line" /><div className="title"><div className="sdot" />Bank Account</div><div className="line" /></div>
                                    <div className="form-grid">
                                        <Field id="accName" label="Account Holder Name" required error={errors.accName}>
                                            <input id="accName" name="accName" value={formData['accName'] || ''} onChange={handleChange} type="text" placeholder="As per bank records" className={errors.accName ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="accNumber" label="Account Number" required error={errors.accNumber}>
                                            <input id="accNumber" name="accNumber" value={formData['accNumber'] || ''} onChange={handleChange} type="text" placeholder="Bank account number" className={errors.accNumber ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="accConfirm" label="Confirm Account No." required error={errors.accConfirm}>
                                            <input id="accConfirm" name="accConfirm" value={formData['accConfirm'] || ''} onChange={handleChange} type="text" placeholder="Re-enter account number" className={errors.accConfirm ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="ifsc" label="IFSC Code" required error={errors.ifsc}>
                                            <input id="ifsc" name="ifsc" value={formData['ifsc'] || ''} onChange={handleChange} type="text" placeholder="e.g. SBIN0001234" maxLength={11} style={{ textTransform: 'uppercase' }} className={errors.ifsc ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="bankName" label="Bank Name" required error={errors.bankName}>
                                            <input id="bankName" name="bankName" value={formData['bankName'] || ''} onChange={handleChange} type="text" placeholder="e.g. State Bank of India" className={errors.bankName ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="branch" label="Branch Name">
                                            <input id="branch" name="branch" value={formData['branch'] || ''} onChange={handleChange} type="text" placeholder="e.g. Lucknow Main Branch" />
                                        </Field>
                                        <Field id="accType" label="Account Type" required error={errors.accType}>
                                            <select id="accType" name="accType" value={formData['accType'] || ''} onChange={handleChange} className={errors.accType ? 'has-error' : ''}>
                                                <option value="">Select type</option>
                                                <option>Savings Account</option><option>Current Account</option>
                                            </select>
                                        </Field>
                                    </div>
                                    <div className="section-divider"><div className="line" /><div className="title"><div className="sdot" />UPI Details</div><div className="line" /></div>
                                    <div className="form-grid">
                                        <div className="field span2">
                                            <label htmlFor="upiId">UPI ID <span className="tip">Optional but preferred</span></label>
                                            <input id="upiId" name="upiId" value={formData['upiId'] || ''} onChange={handleChange} type="text" placeholder="e.g. name@upi or 9876543210@paytm" />
                                        </div>
                                        <Field id="payMethod" label="Preferred Payment Method" required error={errors.payMethod}>
                                            <select id="payMethod" name="payMethod" value={formData['payMethod'] || ''} onChange={handleChange} className={errors.payMethod ? 'has-error' : ''}>
                                                <option value="">Select</option>
                                                <option>Bank Transfer (NEFT/IMPS)</option><option>UPI</option><option>Both (either is fine)</option>
                                            </select>
                                        </Field>
                                        <Field id="payCycle" label="Payment Cycle Preference">
                                            <select id="payCycle" name="payCycle" value={formData['payCycle'] || ''} onChange={handleChange}>
                                                <option value="">Select</option>
                                                <option>Weekly</option><option>Bi-weekly</option><option>Monthly</option>
                                            </select>
                                        </Field>
                                    </div>
                                    <div className="nav-row">
                                        <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                        <button type="button" className="btn btn-primary" onClick={nextStep}>Next →</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Step 4: Documents ──────────────────────────────────────────── */}
                        {currentStep === 4 && !submitted && (
                            <>
                                <div className="card-header">
                                    <div className="section-icon">📄</div>
                                    <div className="card-header-text"><h2>Documents & Declaration</h2><p>Identity verification and consent</p></div>
                                </div>
                                <div className="card-body">
                                    <div className="form-grid">
                                        <Field id="aadhaar" label="Aadhaar Number" required error={errors.aadhaar}>
                                            <input id="aadhaar" name="aadhaar" value={formData['aadhaar'] || ''} onChange={handleChange} type="text" placeholder="12-digit Aadhaar" maxLength={12} className={errors.aadhaar ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="pan" label="PAN Number" tip="Optional">
                                            <input id="pan" name="pan" value={formData['pan'] || ''} onChange={handleChange} type="text" placeholder="e.g. ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
                                        </Field>
                                        <Field id="emergName" label="Emergency Contact Name" required error={errors.emergName}>
                                            <input id="emergName" name="emergName" value={formData['emergName'] || ''} onChange={handleChange} type="text" placeholder="Contact person name" className={errors.emergName ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="emergPhone" label="Emergency Contact No." required error={errors.emergPhone}>
                                            <input id="emergPhone" name="emergPhone" value={formData['emergPhone'] || ''} onChange={handleChange} type="tel" placeholder="10-digit number" maxLength={10} className={errors.emergPhone ? 'has-error' : ''} />
                                        </Field>
                                        <Field id="emergRelation" label="Relation">
                                            <select id="emergRelation" name="emergRelation" value={formData['emergRelation'] || ''} onChange={handleChange}>
                                                <option value="">Select relation</option>
                                                {['Spouse','Parent','Sibling','Friend','Other'].map(r => <option key={r}>{r}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="notes" label="Additional Notes">
                                            <input id="notes" name="notes" value={formData['notes'] || ''} onChange={handleChange} type="text" placeholder="Any special requests or info" />
                                        </Field>
                                    </div>

                                    <div className="section-divider"><div className="line" /><div className="title"><div className="sdot" />Declaration</div><div className="line" /></div>
                                    <div className="decl-box">
                                        I hereby declare that all information provided is true and accurate. I agree to abide by SRV Learning's teaching standards, conduct policies, and payment terms. I understand that any false information may result in termination of engagement.
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                                        {[
                                            { id: 'consent1', text: 'I confirm all details provided are accurate and complete', req: true },
                                            { id: 'consent2', text: "I agree to SRV Learning's Terms & Payment Policy", req: true },
                                            { id: 'consent3', text: 'I consent to my data being stored for payroll purposes', req: false },
                                        ].map(({ id, text, req }) => (
                                            <label key={id} className="consent-chip" htmlFor={id}>
                                                <input type="checkbox" id={id} checked={!!formData[id]} onChange={handleChange} style={{ width: '15px', height: '15px', accentColor: 'var(--navy)', flexShrink: 0 }} />
                                                <span>{text} {req && <span style={{ color: 'var(--amber)' }}>*</span>}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.consent && <span className="err-msg show" style={{ display: 'block' }}>{errors.consent}</span>}

                                    {errors.submit && <div className="global-err" style={{ marginTop: '12px' }}>⚠️ {errors.submit}</div>}

                                    <div className="nav-row">
                                        <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                        <button
                                            type="button"
                                            className="btn btn-amber"
                                            onClick={handleSubmit}
                                            disabled={createOnboarding.isPending}
                                        >
                                            {createOnboarding.isPending && <span className="spinner" />}
                                            {createOnboarding.isPending ? 'Submitting...' : '✓ Submit Registration'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Success Screen ─────────────────────────────────────────────── */}
                        {submitted && submittedData && (
                            <div className="success-screen">
                                <div className="success-circle">✓</div>
                                <h2>Registration Complete!</h2>
                                <p>Your teacher profile has been successfully submitted to SRV Learning.<br />Our team will review and get in touch with you shortly.</p>
                                <div className="summary-grid">
                                    {[
                                        ['Full Name', submittedData.fullName],
                                        ['Alias', submittedData.alias || '—'],
                                        ['Mobile', submittedData.mobile],
                                        ['Email', submittedData.email],
                                        ['City', submittedData.city],
                                        ['Qualification', submittedData.qualification],
                                        ['Subjects', (submittedData.subjects || []).join(', ') || '—'],
                                        ['Experience', submittedData.experience],
                                        ['Rate', `Rs.${submittedData.rate}/hr`],
                                        ['Bank', submittedData.bankName],
                                        ['Acc. No.', maskAcc(submittedData.accNumber || '')],
                                        ['IFSC', submittedData.ifsc],
                                        ['UPI', submittedData.upiId || '—'],
                                        ['Payment Via', submittedData.payMethod],
                                    ].map(([key, val]) => (
                                        <div key={key} className="summary-item">
                                            <div className="key">{key}</div>
                                            <div className="val">{val as string}</div>
                                        </div>
                                    ))}
                                </div>

                                <p style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '8px' }}>
                                    Share this form with other teachers:
                                </p>
                                <div className="share-row">
                                    <button className={`share-btn copy${linkCopied ? ' copied' : ''}`} onClick={copyLink}>
                                        {linkCopied ? '✓ Link Copied!' : '🔗 Copy Form Link'}
                                    </button>
                                    <button className="share-btn whatsapp" onClick={shareWhatsApp}>
                                        📲 Share on WhatsApp
                                    </button>
                                    <button className="share-btn" style={{ background: 'var(--amber)', color: 'var(--navy-dk)' }} onClick={() => window.print()}>
                                        🖨️ Print Record
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
