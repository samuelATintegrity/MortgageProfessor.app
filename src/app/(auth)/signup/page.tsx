"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_EMAILS = [
  "lexi@luminarylending.com",
  "samuel@integritylending.com",
  "josh@integritylending.com",
  "jcline@integritylending.com",
];

const signupSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  company_name: z.string().optional(),
  nmls_number: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupValues) {
    setError(null);
    setSuccess(false);

    if (!ALLOWED_EMAILS.includes(data.email.toLowerCase())) {
      setError("Access is currently limited to invited users.");
      return;
    }

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          company_name: data.company_name ?? "",
          nmls_number: data.nmls_number ?? "",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <div className={`w-full max-w-sm transition-all duration-700 ${success ? "opacity-0 blur-md" : "opacity-100 blur-0"}`}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Start building professional quotes today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600">
            Check your email to confirm your account.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="Jane Doe"
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">
            Company Name{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="company_name"
            placeholder="Acme Lending"
            {...register("company_name")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nmls_number">
            NMLS Number{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="nmls_number"
            placeholder="123456"
            {...register("nmls_number")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full rounded-full bg-black hover:bg-gray-800 text-white"
          disabled={isSubmitting || success}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          Create Account
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
