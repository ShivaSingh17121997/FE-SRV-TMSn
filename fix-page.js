const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', '(dashboard)', 'teachers-onboarding', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Move Label and Err out
const errRegex = /\s*const Err = \(\{ id \}: \{ id: string \}\) => errors\[id\] \? \(\n\s*<p className="text-\[10px\] text-red-500 font-medium mt-0.5">\{errors\[id\]\}<\/p>\n\s*\) : null;/;
const labelRegex = /\s*const Label = \(\{ children, req \}: \{ children: React\.ReactNode; req\?: boolean \}\) => \(\n\s*<label className="block text-\[10px\] font-bold uppercase tracking-wider text-gray-500 mb-1">\n\s*\{children\}\{req && <span className="text-amber-500 ml-0.5">\*<\/span>\}\n\s*<\/label>\n\s*\);/;

content = content.replace(errRegex, '');
content = content.replace(labelRegex, '');

// Update Err tag usage
content = content.replace(/<Err id="([^"]+)" \/>/g, '<Err id="$1" errors={errors} />');

// Insert them at the top (after SUBJECTS array)
const errLabelCode = `
const Err = ({ id, errors }: { id: string, errors: Record<string, string> }) => errors[id] ? (
    <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors[id]}</p>
) : null;

const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
        {children}{req && <span className="text-amber-500 ml-0.5">*</span>}
    </label>
);
`;

content = content.replace(/\/\/ ─── Add Onboarding Modal/, errLabelCode + '\n// ─── Add Onboarding Modal');

// 2. Move Section and InfoRow out
const sectionRegex = /\s*const Section = \(\{ title, icon \}: \{ title: string; icon: string \}\) => \(\n\s*<div className="flex items-center gap-2 mt-5 mb-3">\n\s*<span className="text-base">\{icon\}<\/span>\n\s*<span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">\{title\}<\/span>\n\s*<div className="flex-1 h-px bg-border" \/>\n\s*<\/div>\n\s*\);/;

const infoRowRegex = /\s*const InfoRow = \(\{ label, value \}: \{ label: string; value\?: string \| number \| string\[\] \}\) => \{\n\s*const display = Array\.isArray\(value\) \? value\.join\(', '\) : \(value \|\| '—'\);\n\s*return \(\n\s*<div className="flex flex-col gap-0\.5">\n\s*<span className="text-\[10px\] font-semibold uppercase tracking-widest text-muted-foreground">\{label\}<\/span>\n\s*<span className="text-sm font-medium text-foreground">\{String\(display\)\}<\/span>\n\s*<\/div>\n\s*\);\n\s*\};/;

content = content.replace(sectionRegex, '');
content = content.replace(infoRowRegex, '');

const sectionInfoRowCode = `
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
`;

content = content.replace(/\/\/ ─── Detail View Modal/, sectionInfoRowCode + '\n// ─── Detail View Modal');

// 3. Fix unescaped quotes
content = content.replace(/SRV Learning's/g, "SRV Learning&apos;s");
content = content.replace(/<\/strong>'s/g, "</strong>&apos;s");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed components and quotes.');
