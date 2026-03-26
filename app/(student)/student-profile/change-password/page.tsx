'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useChangeStudentPassword } from '@/lib/hooks/useStudents';
import { Loader2, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
    const { user } = useAuth();
    const changePassword = useChangeStudentPassword();
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { password: '', confirmPassword: '' }
    });

    if (!user) return null;

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
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                <Key className="w-6 h-6 text-emerald-600" /> Security Settings
            </h1>

            <Card className="shadow-sm border border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" /> Change Your Password
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ensure your account stays secure by using a strong password.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                                id="confirmPassword"
                                type="password" 
                                placeholder="Repeat your new password" 
                                {...register('confirmPassword', { 
                                    required: 'Please confirm your password' 
                                })} 
                            />
                            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-900/10 dark:border-orange-800 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                <p className="text-xs text-orange-800 dark:text-orange-200 leading-relaxed">
                                    Changing your password will update your portal login for <strong>{user.email}</strong>. 
                                    Make sure to choose a password that is difficult to guess.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 px-6 h-11"
                                    disabled={changePassword.isPending}
                                >
                                    {changePassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
