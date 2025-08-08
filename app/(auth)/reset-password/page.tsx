'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { toast } from '@/components/toast';

import { resetPasswordWithToken, type ResetPasswordActionState } from '../actions';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, setState] = useState<ResetPasswordActionState>({
    status: 'idle',
  });

  const formAction = async (formData: FormData) => {
    setState({ status: 'in_progress' });
    const result = await resetPasswordWithToken(state, formData);
    setState(result);
  };

  useEffect(() => {
    if (state.status === 'invalid_token') {
      toast({ 
        type: 'error', 
        description: 'Invalid or expired reset token! Please request a new reset link.' 
      });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to reset password!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Please check your password requirements!',
      });
    } else if (state.status === 'success') {
      toast({ 
        type: 'success', 
        description: 'Password reset successfully! You can now sign in.' 
      });
      setIsSuccessful(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state, router]);

  if (!token) {
    return (
      <div className="flex flex-col gap-4 px-4 sm:px-16">
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          Invalid reset link. Please request a new password reset.
        </p>
        <Link
          href="/forgot-password"
          className="text-center font-semibold text-gray-800 hover:underline dark:text-zinc-200"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  const handleSubmit = (formData: FormData) => {
    formData.append('token', token);
    formAction(formData);
  };

  return (
    <>
      {!isSuccessful ? (
        <form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              New Password
            </Label>

            <Input
              id="password"
              name="password"
              className="bg-muted text-md md:text-sm"
              type="password"
              placeholder="Enter your new password"
              required
              autoFocus
              minLength={6}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirmPassword"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              Confirm New Password
            </Label>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              className="bg-muted text-md md:text-sm"
              type="password"
              placeholder="Confirm your new password"
              required
              minLength={6}
            />
          </div>

          <SubmitButton isSuccessful={isSuccessful}>Reset Password</SubmitButton>
          
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Remember your password? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <p className="text-center text-sm text-green-600 dark:text-green-400">
            Password reset successfully! Redirecting to sign in...
          </p>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Reset Password</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}