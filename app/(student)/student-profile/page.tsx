'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useChangeStudentPassword } from '@/lib/hooks/useStudents';
import { User, Mail, Phone, MapPin, Shield, Key, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentProfilePage() {
    const { user } = useAuth();
    const changePassword = useChangeStudentPassword();

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { password: '', confirmPassword: '' }
    });

    if (!user) return null;

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const onSubmit = async (data: any) => {
        if (!user.email) return;
        
        if (data.password !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await changePassword.mutateAsync({ 
                email: user.email, 
                password: data.password 
            });
            reset();
            toast.success('Password updated successfully!');
        } catch (error) {
            toast.error('Failed to update password');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Upper Section: Profile Header and Details */}
            <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Profile Card */}
                <Card className="w-full md:w-80 shadow-sm border border-border overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600" />
                    <CardContent className="pt-0 -mt-12 text-center">
                        <Avatar className="w-24 h-24 mx-auto border-4 border-card shadow-md">
                            <AvatarFallback className="bg-emerald-600 text-white text-2xl font-bold">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold mt-4" style={{ color: 'var(--foreground)' }}>{user.name}</h2>
                        <Badge variant="secondary" className="mt-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Student
                        </Badge>
                        <p className="text-sm mt-3 px-4" style={{ color: 'var(--muted-foreground)' }}>
                            Active learner in SRV Learning Portal.
                        </p>
                    </CardContent>
                </Card>

                {/* Account Details Card */}
                <Card className="flex-1 shadow-sm border border-border">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-600" /> Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> Email Address
                                </Label>
                                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user.email}</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" /> Phone Number
                                </Label>
                                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user.phone || '—'}</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" /> Location
                                </Label>
                                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user.city || '—'}</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" /> Portal Access
                                </Label>
                                <p className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>{user.role}</p>
                            </div>
                        </div>

                        {user.subjects && user.subjects.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3 block">Enrolled Subjects</Label>
                                <div className="flex flex-wrap gap-2">
                                    {user.subjects.map((sub: string) => (
                                        <Badge key={sub} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                                            {sub}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Lower Section: Change Password */}
            <Card className="shadow-sm border border-border">
                <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg flex items-center gap-2 text-black">
                        <Key className="w-5 h-5 text-emerald-600" /> Account Security
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Feeling insecure? Update your portal password below.
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input 
                                    id="password"
                                    type="password" 
                                    placeholder="Min 6 characters" 
                                    {...register('password', { 
                                        required: 'Password is required', 
                                        minLength: { value: 6, message: 'Minimum 6 characters' } 
                                    })} 
                                />
                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input 
                                    id="confirmPassword"
                                    type="password" 
                                    placeholder="Repeat new password" 
                                    {...register('confirmPassword', { 
                                        required: 'Please confirm' 
                                    })} 
                                />
                                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span>Note: Keep your password private and secure.</span>
                            </div>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-semibold shadow-lg shadow-emerald-500/20"
                                disabled={changePassword.isPending}
                            >
                                {changePassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
