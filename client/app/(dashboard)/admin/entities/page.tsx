"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchEntities,
  fetchEntityTree,
  fetchEntityDetail,
  deleteEntity,
} from "@/lib/api-client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EntityForm, type EntityLevel } from "@/components/forms/entity-form";

function EntitiesPageContent() {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [showForm, setShowForm] = useState<"create" | "edit" | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntities();
  }, [viewMode]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const data =
        viewMode === "tree" ? await fetchEntityTree() : await fetchEntities();
      setEntities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading entities:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntityDetail = async (id: string) => {
    try {
      setSaving(true);
      const detail = await fetchEntityDetail(id);
      setSelectedEntity(detail);
      setShowForm("edit");
    } catch (err: any) {
      setError(err?.message || "تعذر جلب بيانات الجهة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entityId: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذه الجهة؟");
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      await deleteEntity(entityId);
      await loadEntities();
    } catch (err: any) {
      setError(err?.message || "تعذر حذف الجهة");
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = entities.map((e) => ({
    id: e.id,
    name: e.name,
    level: e.level as EntityLevel,
  }));

  const renderForm = () => {
    if (!showForm) return null;
    const isEdit = showForm === "edit" && selectedEntity;
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "تعديل جهة" : "إضافة جهة جديدة"}</CardTitle>
        </CardHeader>
        <CardContent>
          <EntityForm
            mode={isEdit ? "edit" : "create"}
            entityId={isEdit ? selectedEntity.id : undefined}
            initialValues={
              isEdit
                ? {
                    name: selectedEntity.name,
                    code: selectedEntity.code,
                    level: selectedEntity.level,
                    parent: selectedEntity.parent,
                    is_active: selectedEntity.is_active,
                    description: selectedEntity.description,
                  }
                : undefined
            }
            parentOptions={parentOptions}
            onSuccess={async () => {
              await loadEntities();
              setShowForm(null);
              setSelectedEntity(null);
            }}
            onCancel={() => {
              setShowForm(null);
              setSelectedEntity(null);
            }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">إدارة الجهات</h1>
          <p className="mt-1 text-sm text-muted">
            إدارة الهيكل الهرمي للجهات (الوكالات، الكليات، الأقسام)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "primary" : "secondary"}
            onClick={() => setViewMode("list")}
          >
            قائمة
          </Button>
          <Button
            variant={viewMode === "tree" ? "primary" : "secondary"}
            onClick={() => setViewMode("tree")}
          >
            هيكلي
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedEntity(null);
              setShowForm("create");
            }}
          >
            + إضافة جهة
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {showForm && renderForm()}

      {loading ? (
        <div className="py-8 text-center">جاري التحميل...</div>
      ) : entities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد جهات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <Card key={entity.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{entity.name}</CardTitle>
                  <Badge tone={entity.is_active ? "success" : "warning"}>
                    {entity.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2 text-sm">
                  {entity.code && (
                    <p>
                      <span className="font-semibold">الرمز:</span> {entity.code}
                    </p>
                  )}
                  {entity.full_path && (
                    <p>
                      <span className="font-semibold">المسار:</span>{" "}
                      {entity.full_path}
                    </p>
                  )}
                  {entity.children_count !== undefined && (
                    <p>
                      <span className="font-semibold">الأبناء:</span>{" "}
                      {entity.children_count}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => {
                      loadEntityDetail(entity.id);
                    }}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    disabled={saving}
                    onClick={() => handleDelete(entity.id)}
                  >
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntitiesPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <EntitiesPageContent />
    </ProtectedRoute>
  );
}

