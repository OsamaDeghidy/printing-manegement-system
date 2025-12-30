"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchCurrentUser,
  type User,
} from "@/lib/api-client";

export default function SettingsPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const userData = await fetchCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoadingData(false);
    }
  };




  if (loadingData) {
    return (
      <div className="text-center py-8">جاري التحميل...</div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">إعدادات الحساب</h1>
        <p className="mt-1 text-sm text-muted">
          حدّث بياناتك الأساسية.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* البيانات الشخصية - متاحة للجميع */}
        <Card padding="lg" shadow="soft" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">البيانات الشخصية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الاسم بالكامل
              </label>
              <Input
                value={user?.full_name || ""}
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                البريد الجامعي
              </label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                القسم/الكلية
              </label>
              <Input
                value={user?.department || ""}
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                رقم التواصل
              </label>
              <Input
                value={user?.phone_number || ""}
                disabled
              />
            </div>
            {user?.entity && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-heading">
                  الجهة
                </label>
                <Input value={user.entity.name || ""} disabled />
              </div>
            )}
            {user?.role && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-heading">
                  الدور
                </label>
                <Input 
                  value={
                    user.role === "print_manager" ? "مدير المطبعة" :
                    user.role === "dept_manager" ? "مدير القسم" :
                    user.role === "dept_employee" ? "موظف القسم" :
                    user.role === "consumer" ? "مستخدم" :
                    user.role === "training_supervisor" ? "مشرف التدريب" :
                    user.role === "inventory" ? "مراقب مخزون" :
                    user.role
                  } 
                  disabled 
                />
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
