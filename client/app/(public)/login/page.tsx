"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
        }
        
        // Handle different error formats
        const errorMessage = 
          errorData?.email?.[0] ||  // Field-specific error
          errorData?.password?.[0] ||  // Field-specific error
          errorData?.detail ||  // General error
          errorData?.non_field_errors?.[0] ||  // Non-field errors
          (response.status === 401 ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : null) ||
          (response.status === 400 ? "البيانات المدخلة غير صحيحة." : null) ||
          `خطأ ${response.status}: ${response.statusText}` ||
          "تعذر تسجيل الدخول، تأكد من البيانات المدخلة.";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Verify that we received tokens
      if (!data.access || !data.refresh) {
        throw new Error("لم يتم استلام التوكن بشكل صحيح من الخادم.");
      }

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("accessToken", data.access);
      storage.setItem("refreshToken", data.refresh);

      // Wait a bit to ensure tokens are saved
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force full page reload to ensure AuthProvider picks up the new token
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-page">
      <div className="mx-auto flex w-full max-w-3xl flex-col justify-center px-6 py-16">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="جامعة طيبة - Taibah University" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-heading">
            إدارة مطابع جامعة طيبة
          </h1>
          <p className="text-sm text-muted">
            Taibah University Print Center Management
          </p>
        </div>

        <div className="rounded-2xl bg-surface px-8 py-10 shadow-[var(--shadow-card)]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                البريد الجامعي
              </label>
              <Input
                type="email"
                placeholder="name@taibahu.edu.sa"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                كلمة المرور
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                تذكرني
              </label>
              <Link href="#" className="font-semibold text-brand-blue">
                نسيت كلمة المرور؟
              </Link>
            </div>
            {errorMessage ? (
              <div className="rounded-lg border border-[#E53935]/30 bg-[#E53935]/10 px-4 py-3 text-sm text-[#B71C1C]">
                {errorMessage}
              </div>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
          <div className="mt-8 rounded-lg bg-brand-teal/10 px-4 py-3 text-sm text-brand-teal">
            لا تملك حساباً بعد؟ تواصل مع إدارة تقنية المعلومات لتفعيل الوصول.
          </div>
          <div className="mt-4 text-center text-xs text-muted">
            يمكنك استخدام المستخدم التجريبي:
            <br />
            admin@printcenter.demo / PrintCenter@2025
          </div>
        </div>
      </div>
    </div>
  );
}


