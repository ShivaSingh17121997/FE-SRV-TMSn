'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
    const { login, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(user.role === 'student' ? '/student-dashboard' : '/dashboard');
        }
    }, [isAuthenticated, user, router]);

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setError('');
        try {
            const success = await login(data.email, data.password);
            if (!success) {
                setError('Invalid email or password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background decoration - subtle and professional */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <div className="w-full max-w-[400px] relative animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        SRV <span className="text-primary">Learning</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest font-medium">
                        Teacher/Student Management Dashboard
                    </p>
                </div>

                {/* Login card */}
                <Card className="border border-border bg-card/80 backdrop-blur-xl shadow-xl">
                    <CardHeader className="space-y-1 pt-8">
                        <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
                        <CardDescription>
                            Sign in to your account to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@school.com"
                                    className="h-11 bg-background/50 border-border focus:ring-1 focus:ring-primary transition-all"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                                        Password
                                    </Label>
                                    <button type="button" className="text-xs text-primary hover:underline underline-offset-4" suppressHydrationWarning>
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="h-11 bg-background/50 border-border focus:ring-1 focus:ring-primary transition-all pr-10"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        suppressHydrationWarning
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs font-medium text-destructive">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-md transition-all active:scale-[0.99]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing In...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer info */}
                <p className="mt-8 text-center text-xs text-muted-foreground" suppressHydrationWarning>
                    &copy; {new Date().getFullYear()} TeacherPro Systems. All rights reserved.
                </p>
            </div>
        </div>
    );
}
