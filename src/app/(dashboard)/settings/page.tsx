"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Lock, CheckCircle2, AlertCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email(),
  company_name: z.string().optional(),
  nmls_number: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

// ── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile form
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  // Password form
  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  // ── Fetch profile on mount ────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select()
          .eq("id", user.id)
          .single();

        resetProfile({
          full_name: profile?.full_name ?? "",
          email: user.email ?? "",
          company_name: profile?.company_name ?? "",
          nmls_number: profile?.nmls_number ?? "",
          phone: profile?.phone ?? "",
        });
      } catch {
        setProfileMsg({ type: "error", text: "Failed to load profile." });
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit handlers ───────────────────────────────────────────────────────

  async function onProfileSubmit(values: ProfileValues) {
    setProfileMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          company_name: values.company_name,
          nmls_number: values.nmls_number,
          phone: values.phone,
        })
        .eq("id", user.id);

      if (error) throw error;
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile.";
      setProfileMsg({ type: "error", text: message });
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPasswordMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) throw error;
      resetPassword();
      setPasswordMsg({
        type: "success",
        text: "Password updated successfully.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update password.";
      setPasswordMsg({ type: "error", text: message });
    }
  }

  // ── Message banner helper ─────────────────────────────────────────────────

  function MessageBanner({
    msg,
  }: {
    msg: { type: "success" | "error"; text: string } | null;
  }) {
    if (!msg) return null;
    return (
      <div
        className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
          msg.type === "success"
            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}
      >
        {msg.type === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        {msg.text}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and security preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-1.5 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-1.5 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal and business details
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleProfile(onProfileSubmit)}>
              <CardContent className="space-y-4">
                <MessageBanner msg={profileMsg} />

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    {...regProfile("full_name")}
                  />
                  {profileErrors.full_name && (
                    <p className="text-sm text-destructive">
                      {profileErrors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    disabled
                    className="bg-muted"
                    {...regProfile("email")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here.
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      placeholder="ABC Mortgage"
                      {...regProfile("company_name")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nmls_number">NMLS Number</Label>
                    <Input
                      id="nmls_number"
                      placeholder="123456"
                      {...regProfile("nmls_number")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    {...regProfile("phone")}
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={profileSubmitting}>
                  {profileSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Profile
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* ── Security Tab ────────────────────────────────────────────────── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password. Must be at least 8 characters.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handlePassword(onPasswordSubmit)}>
              <CardContent className="space-y-4">
                <MessageBanner msg={passwordMsg} />

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...regPassword("password")}
                  />
                  {passwordErrors.password && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...regPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={passwordSubmitting}>
                  {passwordSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
