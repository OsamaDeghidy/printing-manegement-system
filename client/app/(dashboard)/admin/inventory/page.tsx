"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth-context";
import { InventoryForm } from "@/components/forms/inventory-form";
import { InventoryAdjustForm } from "@/components/forms/inventory-adjust-form";
import {
  fetchInventoryItems,
  deleteInventoryItem,
  type InventoryItem,
} from "@/lib/api-client";

function AdminInventoryPageContent() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  
  // Check permissions
  const canManage = hasRole("admin") || hasRole("inventory");
  const canAdjust = hasRole("admin") || hasRole("inventory") || hasRole("print_manager");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchInventoryItems();
      // Handle paginated response
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data?.results && Array.isArray(data.results)) {
        setItems(data.results);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading inventory items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) return;
    try {
      await deleteInventoryItem(id);
      loadItems();
    } catch (error: any) {
      alert(error.message || "فشل حذف المادة");
    }
  };

  const lowStockItems = items.filter((item) => item.status === "critical" || item.status === "warning");

  if (showForm) {
    return (
      <InventoryForm
        onSuccess={() => {
          setShowForm(false);
          loadItems();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (editingItem) {
    return (
      <InventoryForm
        itemId={editingItem}
        onSuccess={() => {
          setEditingItem(null);
          loadItems();
        }}
        onCancel={() => setEditingItem(null)}
      />
    );
  }

  if (adjustingItem) {
    return (
      <InventoryAdjustForm
        itemId={adjustingItem.id}
        itemName={adjustingItem.name}
        currentQuantity={adjustingItem.current_quantity}
        onSuccess={() => {
          setAdjustingItem(null);
          loadItems();
        }}
        onCancel={() => setAdjustingItem(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">إدارة المخزون</h1>
          <p className="mt-1 text-sm text-muted">
            تتبع المواد، حدّد الحدود الدنيا، واطلب التوريدات الجديدة بسهولة.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>+ إضافة مادة جديدة</Button>
        )}
      </header>

      {lowStockItems.length > 0 && (
        <Card padding="lg" shadow="soft">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>تنبيهات المخزون</CardTitle>
            <Badge tone="warning">{lowStockItems.length} تنبيهات</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            {lowStockItems.map((item) => (
              <AlertRow
                key={item.id}
                tone={item.status === "critical" ? "danger" : "warning"}
                title={`${item.name} - الكمية: ${item.current_quantity} / الحد الأدنى: ${item.minimum_threshold}`}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد مواد في المخزون
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <Badge tone={statusTone(item.status)}>
                  {statusLabel(item.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted">
                <p>
                  الكمية الحالية: <strong className="text-heading">{item.current_quantity}</strong> {item.unit}
                </p>
                <p>
                  الحدود: {item.minimum_threshold} حد أدنى • {item.maximum_threshold} حد أقصى
                </p>
                {item.last_restocked_at && (
                  <p>آخر تزويد: {new Date(item.last_restocked_at).toLocaleDateString("ar-SA")}</p>
                )}
                {item.last_usage_at && (
                  <p>آخر استهلاك: {new Date(item.last_usage_at).toLocaleDateString("ar-SA")}</p>
                )}
                <div className="flex gap-2">
                  {canAdjust && (
                    <Button
                      variant="secondary"
                      fullWidth
                      size="sm"
                      onClick={() => setAdjustingItem(item)}
                    >
                      تحديث الكمية
                    </Button>
                  )}
                  {canManage && (
                    <>
                      <Button
                        variant="secondary"
                        fullWidth
                        size="sm"
                        onClick={() => setEditingItem(item.id)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        fullWidth
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        حذف
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({
  tone,
  title,
}: {
  tone: "danger" | "warning" | "info";
  title: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span>{title}</span>
      <Badge tone={tone}>تنبيه</Badge>
    </div>
  );
}

function statusTone(status: "critical" | "warning" | "ok") {
  switch (status) {
    case "critical":
      return "danger" as const;
    case "warning":
      return "warning" as const;
    default:
      return "success" as const;
  }
}

function statusLabel(status: "critical" | "warning" | "ok") {
  switch (status) {
    case "critical":
      return "حرج";
    case "warning":
      return "تحذير";
    default:
      return "جيد";
  }
}

export default function AdminInventoryPage() {
  return (
    <ProtectedRoute requiredRoles={["inventory", "print_manager", "admin"]}>
      <AdminInventoryPageContent />
    </ProtectedRoute>
  );
}
