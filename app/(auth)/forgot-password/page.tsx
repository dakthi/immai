'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import Form from 'next/form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { toast } from '@/components/toast';

import { forgotPassword, type ForgotPasswordActionState } from '../actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<ForgotPasswordActionState, FormData>(
    forgotPassword,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'user_not_found') {
      toast({ type: 'error', description: 'No account found with this email!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to send reset email!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Please enter a valid email address!',
      });
    } else if (state.status === 'success') {
      toast({ 
        type: 'success', 
        description: 'Password reset link sent! Check your console for the link (development mode).' 
      });
      setIsSuccessful(true);
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Forgot Password</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>
        
        {!isSuccessful ? (
          <Form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Email Address
              </Label>

              <Input
                id="email"
                name="email"
                className="bg-muted text-md md:text-sm"
                type="email"
                placeholder="user@acme.com"
                autoComplete="email"
                required
                autoFocus
                defaultValue={email}
              />
            </div>

            <SubmitButton isSuccessful={isSuccessful}>Send Reset Link</SubmitButton>
            
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {'Remember your password? '}
              <Link
                href="/login"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign in
              </Link>
            </p>
          </Form>
        ) : (
          <div className="flex flex-col gap-4 px-4 sm:px-16">
            <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
              If an account with that email exists, you'll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="text-center font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Back to Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}