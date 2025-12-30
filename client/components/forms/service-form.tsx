"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceDefinition, ServiceField } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { RadioGroup } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { createOrder, fetchServices, fetchEntities } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type FieldValue = string | number | File[] | undefined;

interface ServiceFormProps {
  service: ServiceDefinition;
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const initialState = useMemo(
    () =>
      service.fields.reduce<Record<string, FieldValue>>((acc, field) => {
        acc[field.name] = undefined;
        return acc;
      }, {}),
    [service.fields]
  );

  const [values, setValues] = useState<Record<string, FieldValue>>(initialState);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<Array<{ id: string; name: string; level: string }>>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Load entities when component mounts
  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoadingEntities(true);
        // Fetch only active entities
        const data = await fetchEntities(true);
        
        // Handle pagination response (if API returns paginated results)
        let entitiesList: any[] = [];
        if (Array.isArray(data)) {
          entitiesList = data;
        } else if (data && Array.isArray(data.results)) {
          // DRF pagination format
          entitiesList = data.results;
        } else if (data && typeof data === 'object') {
          // Try to extract array from response
          console.warn("Unexpected entities response format:", data);
          entitiesList = [];
        }
        
        if (entitiesList.length > 0) {
          // Filter to only active entities and sort by name
          const activeEntities = entitiesList
            .filter((e: any) => e.is_active !== false)
            .map((e: any) => ({
              id: e.id,
              name: e.name,
              level: e.level || "",
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
          
          setEntities(activeEntities);
          console.log(`Loaded ${activeEntities.length} active entities:`, activeEntities.map(e => e.name));
        } else {
          console.warn("No entities found in response");
        }
      } catch (err: any) {
        console.error("Could not load entities:", err);
        // Don't throw error, just log it - entity field is optional
        if (err?.status === 403) {
          console.warn("Permission denied for entities API - entity field will be disabled");
        }
      } finally {
        setLoadingEntities(false);
      }
    };
    loadEntities();
  }, []);

  const onFieldChange = (field: ServiceField, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      const missingFields: string[] = [];
      service.fields.forEach((field) => {
        if (field.required && !values[field.name]) {
          missingFields.push(field.label);
        }
      });

      if (missingFields.length > 0) {
        setError(`يرجى تعبئة الحقول الإلزامية: ${missingFields.join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      // Fetch the service from API to get the real service ID and field IDs
      // This is REQUIRED because static IDs are not UUIDs
      let serviceId: string | null = null;
      let fieldIdMap: Record<string, string> = {}; // Maps field name/key to field ID
      
      try {
        console.log("Fetching services from API for service:", service.slug, service.id);
        const services = await fetchServices();
        console.log("Fetched services:", services);
        
        // Handle pagination response
        let servicesList: any[] = [];
        if (Array.isArray(services)) {
          servicesList = services;
        } else if (services && Array.isArray(services.results)) {
          servicesList = services.results;
        } else {
          console.error("Unexpected services response format:", services);
          throw new Error("تنسيق استجابة الـ API غير متوقع");
        }
        
        // Find the service by slug (preferred) or by static ID
        const apiService = servicesList.find((s: any) => {
          const matchBySlug = s.slug === service.slug;
          const matchById = s.id === service.id;
          console.log(`Checking service: ${s.slug} (${s.id}) - slug match: ${matchBySlug}, id match: ${matchById}`);
          return matchBySlug || matchById;
        });
        
        if (!apiService) {
          console.error("Service not found in API. Available services:", servicesList.map((s: any) => ({ slug: s.slug, id: s.id, name: s.name })));
          throw new Error(`الخدمة "${service.name}" (${service.slug}) غير موجودة في النظام. يرجى التواصل مع الإدارة.`);
        }
        
        console.log("Found API service:", apiService);
        serviceId = apiService.id;
        
        // Validate that serviceId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!serviceId || !uuidRegex.test(serviceId)) {
          throw new Error(`معرف الخدمة غير صحيح: ${serviceId}. يجب أن يكون UUID صالح.`);
        }
        
        // Map field names/keys to field IDs from API
        if (apiService.fields && Array.isArray(apiService.fields)) {
          console.log("API service fields:", apiService.fields);
          apiService.fields.forEach((apiField: any) => {
            // Match by key (preferred) - field.key in API matches field.name in static data
            const matchingField = service.fields.find(
              (f) => f.name === apiField.key
            );
            if (matchingField && apiField.id) {
              // Validate field ID is UUID
              if (uuidRegex.test(apiField.id)) {
                fieldIdMap[matchingField.name] = apiField.id;
                console.log(`Mapped field ${matchingField.name} (${matchingField.label}) to ID: ${apiField.id}`);
              } else {
                console.warn(`Field ${apiField.key} has invalid UUID: ${apiField.id}`);
              }
            } else {
              console.warn(`No matching field found for API field: ${apiField.key} (${apiField.label})`);
            }
          });
        } else {
          console.warn("API service has no fields array:", apiService);
        }
        
        console.log("Field ID map:", fieldIdMap);
        
        // Verify we have IDs for all required fields
        const missingFieldIds = service.fields
          .filter((f) => {
            const hasValue = values[f.name] !== undefined && values[f.name] !== "" && values[f.name] !== null;
            const isRequired = f.required;
            return hasValue || isRequired;
          })
          .filter((f) => !fieldIdMap[f.name]);
        
        if (missingFieldIds.length > 0) {
          console.warn("Some fields don't have IDs from API:", missingFieldIds.map(f => ({ name: f.name, label: f.label })));
          // Only throw error for required fields
          const missingRequired = missingFieldIds.filter(f => f.required);
          if (missingRequired.length > 0) {
            throw new Error(`لم يتم العثور على معرفات للحقول الإلزامية: ${missingRequired.map(f => f.label).join(", ")}`);
          }
        }
      } catch (err) {
        console.error("Error fetching service from API:", err);
        throw new Error(
          `تعذر جلب بيانات الخدمة من النظام. ${err instanceof Error ? err.message : "يرجى المحاولة مرة أخرى أو التواصل مع الإدارة."}`
        );
      }
      
      if (!serviceId) {
        throw new Error("لم يتم العثور على معرف الخدمة. يرجى المحاولة مرة أخرى.");
      }
      
      // Final validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(serviceId)) {
        throw new Error(`معرف الخدمة غير صحيح: ${serviceId}. يجب أن يكون UUID صالح.`);
      }

      // Prepare field values for API
      // MUST use API field IDs - static IDs are not valid UUIDs
      const fieldValues = service.fields
        .filter((field) => {
          // Only include fields that have values
          const value = values[field.name];
          // Skip empty values, but allow 0 for numbers and false for booleans
          if (value === undefined || value === "" || value === null) {
            return false;
          }
          // Skip empty arrays
          if (Array.isArray(value) && value.length === 0) {
            return false;
          }
          return true;
        })
        .map((field) => {
          let value = values[field.name];
          
          // Handle file fields - for now, we'll send file names
          // In production, files should be uploaded separately via FormData
          if (Array.isArray(value) && value.length > 0) {
            value = value.map((file: File) => file.name).join(", ");
          }
          
          // Handle link fields
          if (field.type === "file" && links[field.name]) {
            value = links[field.name];
          }

          // Get field ID from API - skip if not found (for optional fields)
          const fieldId = fieldIdMap[field.name];
          
          if (!fieldId) {
            // If field is required, throw error. Otherwise, skip it.
            if (field.required) {
              throw new Error(`لم يتم العثور على معرف الحقل "${field.label}". يرجى المحاولة مرة أخرى.`);
            }
            // Skip optional fields that don't have IDs
            console.warn(`Skipping optional field ${field.name} (${field.label}) - no ID found`);
            return null;
          }

          // Validate field ID is UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(fieldId)) {
            console.error(`Invalid field ID for ${field.name}: ${fieldId}`);
            if (field.required) {
              throw new Error(`معرف الحقل "${field.label}" غير صحيح: ${fieldId}`);
            }
            return null;
          }

          return {
            field: fieldId,
            value: value,
          };
        })
        .filter((fv) => fv !== null) as Array<{ field: string; value: any }>;

      // Prepare order data - only include department if it exists
      const orderData: {
        service: string;
        field_values: Array<{ field: string; value: any }>;
        priority: string;
        department?: string;
      } = {
        service: serviceId,
        field_values: fieldValues,
        priority: "medium", // Default priority: low, medium, or high
      };
      
      // Only add department if user has one
      if (user?.department) {
        orderData.department = user.department;
      }

      console.log("Prepared order data:", orderData);

      // Validate all field IDs are UUIDs before sending
      const invalidFieldIds = fieldValues.filter(fv => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return !uuidRegex.test(fv.field);
      });
      
      if (invalidFieldIds.length > 0) {
        console.error("Invalid field IDs found:", invalidFieldIds);
        throw new Error(`بعض معرفات الحقول غير صحيحة. يرجى المحاولة مرة أخرى.`);
      }

      // Create order via API
      await createOrder(orderData);

      // Redirect to orders page
      router.push("/orders");
    } catch (err: any) {
      console.error("Error creating order:", err);
      
      // Extract detailed error message
      let errorMessage = "حدث خطأ أثناء إنشاء الطلب";
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // If error has details, show them
        if (err.details) {
          const details = err.details;
          if (details.field_values) {
            errorMessage += `\n\nالحقول: ${JSON.stringify(details.field_values, null, 2)}`;
          } else if (details.service) {
            errorMessage += `\n\nالخدمة: ${JSON.stringify(details.service, null, 2)}`;
          } else {
            errorMessage += `\n\nالتفاصيل: ${JSON.stringify(details, null, 2)}`;
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl bg-surface px-8 py-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge tone={service.requiresApproval ? "warning" : "success"}>
            {service.requiresApproval ? "تتطلب موافقة" : "تنفيذ فوري"}
          </Badge>
          <Badge tone="info">{service.category}</Badge>
        </div>
        <div className="grid gap-6">
          {service.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-heading">
                  {field.label}
                  {field.required ? (
                    <span className="mr-2 text-xs text-[#E53935]">إلزامي</span>
                  ) : null}
                </label>
                {field.helperText ? (
                  <span className="text-xs text-muted">{field.helperText}</span>
                ) : null}
              </div>
              <FieldRenderer
                field={field}
                value={values[field.name]}
                onChange={(val) => onFieldChange(field, val)}
                linkValue={links[field.name]}
                onLinkChange={(val) =>
                  setLinks((prev) => ({ ...prev, [field.name]: val }))
                }
                entities={entities}
                loadingEntities={loadingEntities}
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#E53935]/30 bg-[#E53935]/10 px-6 py-4 text-sm text-[#E53935]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-4">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
}

interface FieldRendererProps {
  field: ServiceField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  linkValue?: string;
  onLinkChange?: (value: string) => void;
}

function FieldRenderer({
  field,
  value,
  onChange,
  linkValue,
  onLinkChange,
  entities = [],
  loadingEntities = false,
}: FieldRendererProps & { entities?: Array<{ id: string; name: string; level: string }>; loadingEntities?: boolean }) {
  switch (field.type) {
    case "text":
      return (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="اكتب هنا..."
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={typeof value === "number" || typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
        />
      );
    case "textarea":
      return (
        <TextArea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="أدخل التفاصيل أو الملاحظات..."
          rows={4}
        />
      );
    case "radio":
      return (
        <RadioGroup
          name={field.name}
          value={typeof value === "string" ? value : undefined}
          options={field.options?.map((option) => ({
            value: option.value,
            label: option.label,
          })) ?? []}
          onChange={(selected) => onChange(selected)}
        />
      );
    case "entity":
      // Entity selector dropdown
      const levelLabels: Record<string, string> = {
        vice_rectorate: "وكالة/قطاع",
        college_deanship: "كلية/عمادة",
        department_unit: "قسم/وحدة",
      };
      return (
        <Select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={loadingEntities}
          options={[
            { value: "", label: "بدون" },
            ...entities.map((e) => ({
              value: e.id,
              label: `${e.name}${e.level ? ` (${levelLabels[e.level] || e.level})` : ""}`,
            })),
          ]}
        />
      );
    case "file":
      return (
        <div className="space-y-4">
          <FileUpload
            onFilesChange={(files) => onChange(files)}
            description="يدعم PDF, DOCX, الصور حتى 50 ميجابايت للملف الواحد."
          />
          <Input
            placeholder="أو أضف رابطاً من Google Drive أو OneDrive"
            value={linkValue ?? ""}
            onChange={(event) => onLinkChange?.(event.target.value)}
          />
        </div>
      );
    case "link":
      return (
        <Input
          type="url"
          placeholder="https://"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    default:
      return null;
  }
}


