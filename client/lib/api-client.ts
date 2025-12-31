"use client";

import { services, getServiceBySlug } from "@/data/services";
import {
  mockOrders,
  type OrderDetail,
  type OrderSummary,
  type OrderStatus,
} from "@/data/orders";
import type { User } from "./types";

// Re-export User type for convenience
export type { User };
// Re-export OrderSummary type for convenience
export type { OrderSummary };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api";

/**
 * Get authentication headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  // Check if we're in browser environment
  if (typeof window === "undefined") {
    return {
      "Content-Type": "application/json",
    };
  }

  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Generic API fetch function with automatic auth headers
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Convert HeadersInit to Record<string, string> for easier manipulation
  const authHeaders = getAuthHeaders();
  const initHeaders = init?.headers;
  
  let headers: Record<string, string> = {};
  
  // Convert authHeaders to Record
  if (authHeaders instanceof Headers) {
    authHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(authHeaders)) {
    authHeaders.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else {
    headers = { ...authHeaders };
  }
  
  // Merge with init headers
  if (initHeaders) {
    if (initHeaders instanceof Headers) {
      initHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(initHeaders)) {
      initHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      headers = { ...headers, ...initHeaders };
    }
  }

  // Don't override Content-Type if it's FormData (let browser set it automatically)
  if (init?.body instanceof FormData) {
    const { "Content-Type": _, ...headersWithoutContentType } = headers;
    headers = headersWithoutContentType;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: init?.cache ?? "no-store",
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    // Try to get error details from response
    let errorMessage = `API request failed (${response.status} ${response.statusText})`;
    let errorDetails: any = {};
    try {
      const errorData = await response.clone().json();
      errorDetails = errorData;
      
      // Handle different error formats
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.join(", ");
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.non_field_errors) {
        errorMessage = Array.isArray(errorData.non_field_errors) 
          ? errorData.non_field_errors.join(", ")
          : errorData.non_field_errors;
      } else if (typeof errorData === "string") {
        errorMessage = errorData;
      } else {
        // Format field-specific errors
        const fieldErrors: string[] = [];
        Object.keys(errorData).forEach((key) => {
          const value = errorData[key];
          if (Array.isArray(value)) {
            fieldErrors.push(`${key}: ${value.join(", ")}`);
          } else if (typeof value === "string") {
            fieldErrors.push(`${key}: ${value}`);
          }
        });
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(" | ");
        }
      }
    } catch {
      // If response is not JSON, use status text
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    (error as any).details = errorDetails;
    throw error;
  }

  return (await response.json()) as T;
}

/**
 * Fetch current user profile
 */
export async function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>("/accounts/users/me/");
}

export async function fetchServices(): Promise<Service[]> {
  try {
    const data = await apiFetch<any>("/catalog/services/");
    
    // Handle pagination response (DRF format)
    let servicesList: Service[] = [];
    if (Array.isArray(data)) {
      servicesList = data;
    } else if (data && Array.isArray(data.results)) {
      // DRF pagination format: { count, next, previous, results: [...] }
      servicesList = data.results;
    } else if (data && typeof data === 'object') {
      console.warn("Unexpected services response format:", data);
      // Try to extract services from response
      if (data.services && Array.isArray(data.services)) {
        servicesList = data.services;
      } else {
        // Fallback to static data
        console.warn("Falling back to local services data - API response format not recognized");
        return services as unknown as Service[];
      }
    }
    
    if (servicesList.length > 0) {
      console.log(`Fetched ${servicesList.length} services from API`);
      return servicesList as unknown as Service[];
    } else {
      console.warn("No services found in API response, using static data");
      return services as unknown as Service[];
    }
  } catch (error) {
    console.warn("Falling back to local services data:", error);
    return services as unknown as Service[];
  }
}

export async function fetchServiceDetail(slug: string) {
  try {
    const data = await apiFetch(`/catalog/services/?slug=${slug}`);
    if (Array.isArray(data) && data.length) {
      return data[0];
    }
  } catch (error) {
    console.warn(`Service ${slug} fallback to local data:`, error);
  }
  return getServiceBySlug(slug);
}

// Backend API response types
interface BackendOrderListResponse {
  id: string;
  order_code: string;
  service: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
  };
  requester: {
    id: string;
    full_name: string;
    department?: string;
  };
  department?: string;
  entity?: {
    id: string;
    name: string;
  };
  status: string;
  priority: string;
  submitted_at: string;
  requires_approval: boolean;
}

interface BackendOrderDetailResponse extends BackendOrderListResponse {
  field_values: Array<{
    id: string;
    field: string;
    field_label: string;
    field_key: string;
    value: any;
  }>;
  attachments: Array<{
    id: string;
    attachment_type: "file" | "link";
    file?: string;
    link_url?: string;
    name: string;
    size_bytes?: number;
    uploaded_at: string;
  }>;
  approvals: Array<{
    id: string;
    approver: {
      id: string;
      full_name: string;
    };
    step: number;
    decision: "pending" | "approved" | "rejected";
    comment?: string;
    decided_at?: string;
  }>;
  status_history: Array<{
    id: string;
    status: string;
    note?: string;
    changed_by: {
      id: string;
      full_name: string;
    };
    changed_at: string;
  }>;
  approved_at?: string;
  completed_at?: string;
}

// Helper function to extract array from paginated response
function extractArrayFromResponse<T>(response: any): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.results && Array.isArray(response.results)) {
    return response.results;
  }
  return [];
}

export async function fetchOrders(): Promise<OrderSummary[]> {
  try {
    // Fetch all order types: regular orders, design orders, and print orders
    const [regularOrders, designOrders, printOrders] = await Promise.allSettled([
      apiFetch<any>("/orders/orders/").catch(() => []),
      apiFetch<any>("/orders/design-orders/").catch(() => []),
      apiFetch<any>("/orders/print-orders/").catch(() => []),
    ]);

    const allOrders: OrderSummary[] = [];

    // Process regular orders
    if (regularOrders.status === "fulfilled") {
      const ordersArray = extractArrayFromResponse<BackendOrderListResponse>(regularOrders.value);
      allOrders.push(...ordersArray.map(mapBackendOrderToListSummary));
    }

    // Process design orders
    if (designOrders.status === "fulfilled") {
      const ordersArray = extractArrayFromResponse<any>(designOrders.value);
      allOrders.push(...ordersArray.map(mapDesignOrderToListSummary));
    }

    // Process print orders
    if (printOrders.status === "fulfilled") {
      const ordersArray = extractArrayFromResponse<any>(printOrders.value);
      allOrders.push(...ordersArray.map(mapPrintOrderToListSummary));
    }

    if (allOrders.length > 0) {
      // Sort by submitted_at descending (newest first)
      return allOrders.sort((a, b) => {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return dateB - dateA;
      });
    }
  } catch (error) {
    console.warn("Orders API unavailable, using mock data:", error);
  }
  return mockOrders.map(mapOrderDetailToSummary);
}

export async function fetchOrderDetail(orderCode: string): Promise<OrderDetail | undefined> {
  try {
    // Try regular orders first
    try {
      const ordersResponse = await apiFetch<any>("/orders/orders/");
      const orders = extractArrayFromResponse<BackendOrderDetailResponse>(ordersResponse);
      const order = orders.find((o) => o.order_code === orderCode);
      if (order) {
        const detail = await apiFetch<BackendOrderDetailResponse>(`/orders/orders/${order.id}/`);
        return mapBackendOrderToDetail(detail);
      }
    } catch (error) {
      // Continue to try design/print orders
    }

    // Try design orders
    try {
      const designOrdersResponse = await apiFetch<any>("/orders/design-orders/");
      const designOrders = extractArrayFromResponse<any>(designOrdersResponse);
      const designOrder = designOrders.find((o) => o.order_code === orderCode);
      if (designOrder) {
        const detail = await apiFetch<any>(`/orders/design-orders/${designOrder.id}/`);
        return mapDesignOrderToDetail(detail);
      }
    } catch (error) {
      // Continue to try print orders
    }

    // Try print orders
    try {
      const printOrdersResponse = await apiFetch<any>("/orders/print-orders/");
      const printOrders = extractArrayFromResponse<any>(printOrdersResponse);
      const printOrder = printOrders.find((o) => o.order_code === orderCode);
      if (printOrder) {
        const detail = await apiFetch<any>(`/orders/print-orders/${printOrder.id}/`);
        return mapPrintOrderToDetail(detail);
      }
    } catch (error) {
      // Not found in any type
    }
  } catch (error) {
    console.warn(`Order ${orderCode} fallback to mock data:`, error);
  }
  return mockOrders.find((order) => order.orderCode === orderCode);
}

// Update order status functions
export async function updateOrderStatus(
  orderCode: string,
  status: string,
  note?: string
): Promise<any> {
  // First, get the order detail to find the ID
  const orderDetail = await fetchOrderDetail(orderCode);
  if (!orderDetail) {
    throw new Error(`Order ${orderCode} not found`);
  }
  
  return apiFetch(`/orders/orders/${orderDetail.id}/update-status/`, {
    method: "POST",
    body: JSON.stringify({ status, note: note || "" }),
  });
}

export async function updateDesignOrderStatus(
  orderCode: string,
  status: string,
  note?: string
): Promise<any> {
  // First, get the order detail to find the ID
  const orderDetail = await fetchOrderDetail(orderCode);
  if (!orderDetail) {
    throw new Error(`Design order ${orderCode} not found`);
  }
  
  return apiFetch(`/orders/design-orders/${orderDetail.id}/update-status/`, {
    method: "POST",
    body: JSON.stringify({ status, note: note || "" }),
  });
}

export async function updatePrintOrderStatus(
  orderCode: string,
  status: string,
  note?: string
): Promise<any> {
  // First, get the order detail to find the ID
  const orderDetail = await fetchOrderDetail(orderCode);
  if (!orderDetail) {
    throw new Error(`Print order ${orderCode} not found`);
  }
  
  return apiFetch(`/orders/print-orders/${orderDetail.id}/update-status/`, {
    method: "POST",
    body: JSON.stringify({ status, note: note || "" }),
  });
}

// Download order receipt
export async function downloadOrderReceipt(orderCode: string): Promise<void> {
  const orderDetail = await fetchOrderDetail(orderCode);
  if (!orderDetail) {
    throw new Error(`Order ${orderCode} not found`);
  }
  
  // Determine the correct endpoint based on order type
  let endpoint = "";
  if (orderDetail.orderType === "design_order") {
    endpoint = `/orders/design-orders/${orderDetail.id}/receipt/`;
  } else if (orderDetail.orderType === "print_order") {
    endpoint = `/orders/print-orders/${orderDetail.id}/receipt/`;
  } else {
    endpoint = `/orders/orders/${orderDetail.id}/receipt/`;
  }
  
  // Get auth headers using the same method as apiFetch
  const authHeaders = getAuthHeaders();
  
  // Convert HeadersInit to Record<string, string> for easier manipulation
  let headers: Record<string, string> = {};
  if (authHeaders instanceof Headers) {
    authHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(authHeaders)) {
    authHeaders.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else {
    headers = { ...authHeaders };
  }
  
  // Add Accept header for HTML
  headers["Accept"] = "text/html";
  
  // Fetch receipt as HTML
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: headers as HeadersInit,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.");
    }
    throw new Error(`فشل تحميل الإيصال: ${response.statusText}`);
  }
  
  // Get HTML content
  const htmlContent = await response.text();
  
  // Create a blob and download
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `receipt_${orderCode}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  // Also open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

function mapDesignOrderToDetail(order: any): OrderDetail {
  return {
    id: order.id,
    orderCode: order.order_code,
    orderType: "design_order",
    service: {
      id: `design-${order.design_type}`,
      name: `خدمة التصميم - ${order.title || order.design_type}`,
      slug: `design-${order.design_type}`,
      icon: "🎨",
    },
    requester: {
      name: order.requester?.full_name || "غير معروف",
      department: order.requester?.department || order.entity?.name || "",
    },
    quantity: undefined,
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: true,
    fieldValues: [
      { id: "design-type", fieldId: "design_type", label: "نوع التصميم", key: "design_type", value: order.design_type },
      { id: "title", fieldId: "title", label: "العنوان", key: "title", value: order.title },
      ...(order.size ? [{ id: "size", fieldId: "size", label: "الحجم", key: "size", value: order.size }] : []),
      ...(order.description ? [{ id: "description", fieldId: "description", label: "الوصف", key: "description", value: order.description }] : []),
    ],
    attachments: (order.attachments || []).map((att: any) => ({
      id: att.id,
      type: att.attachment_type || "file",
      name: att.name,
      url: att.file || att.link_url || "#",
      sizeKb: att.size_bytes ? Math.round(att.size_bytes / 1024) : undefined,
    })),
    approvals: [],
    statusHistory: (order.status_history || []).map((entry: any) => ({
      id: entry.id,
      status: entry.status as OrderStatus,
      note: entry.note,
      updatedBy: entry.changed_by?.full_name || "النظام",
      updatedAt: entry.changed_at,
    })),
  };
}

function mapPrintOrderToDetail(order: any): OrderDetail {
  return {
    id: order.id,
    orderCode: order.order_code,
    orderType: "print_order",
    service: {
      id: `print-${order.print_type}`,
      name: `خدمة الطباعة - ${order.print_type}`,
      slug: `print-${order.print_type}`,
      icon: "🖨️",
    },
    requester: {
      name: order.requester?.full_name || "غير معروف",
      department: order.requester?.department || order.entity?.name || "",
    },
    quantity: order.quantity,
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: true,
    fieldValues: [
      { id: "print-type", fieldId: "print_type", label: "نوع الطباعة", key: "print_type", value: order.print_type },
      ...(order.quantity ? [{ id: "quantity", fieldId: "quantity", label: "الكمية", key: "quantity", value: order.quantity }] : []),
      ...(order.size ? [{ id: "size", fieldId: "size", label: "الحجم", key: "size", value: order.size }] : []),
      ...(order.paper_type ? [{ id: "paper_type", fieldId: "paper_type", label: "نوع الورق", key: "paper_type", value: order.paper_type }] : []),
    ],
    attachments: (order.attachments || []).map((att: any) => ({
      id: att.id,
      type: att.attachment_type || "file",
      name: att.name,
      url: att.file || att.link_url || "#",
      sizeKb: att.size_bytes ? Math.round(att.size_bytes / 1024) : undefined,
    })),
    approvals: [],
    statusHistory: (order.status_history || []).map((entry: any) => ({
      id: entry.id,
      status: entry.status as OrderStatus,
      note: entry.note,
      updatedBy: entry.changed_by?.full_name || "النظام",
      updatedAt: entry.changed_at,
    })),
  };
}

function mapBackendOrderToListSummary(order: BackendOrderListResponse): OrderSummary {
  // Quantity is not available in list view (OrderListSerializer doesn't include field_values)
  // It will be available in detail view
  return {
    id: order.id,
    orderCode: order.order_code,
    service: {
      id: order.service.id,
      name: order.service.name,
      slug: order.service.slug,
      icon: order.service.icon,
    },
    requester: {
      name: order.requester.full_name,
      department: order.requester.department || order.department,
    },
    quantity: undefined, // Not available in list view, will be shown in detail view
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: order.requires_approval,
  };
}

// Design Order response type
interface BackendDesignOrderResponse {
  id: string;
  order_code: string;
  requester: {
    id: string;
    full_name: string;
    department?: string;
  };
  entity?: {
    id: string;
    name: string;
  };
  design_type: string;
  title: string;
  size?: string;
  priority: string;
  status: string;
  submitted_at: string;
}

// Print Order response type
interface BackendPrintOrderResponse {
  id: string;
  order_code: string;
  requester: {
    id: string;
    full_name: string;
    department?: string;
  };
  entity?: {
    id: string;
    name: string;
  };
  print_type: string;
  quantity?: number;
  priority: string;
  status: string;
  submitted_at: string;
}

function mapDesignOrderToListSummary(order: BackendDesignOrderResponse): OrderSummary {
  return {
    id: order.id,
    orderCode: order.order_code,
    service: {
      id: `design-${order.design_type}`,
      name: `خدمة التصميم - ${order.title}`,
      slug: `design-${order.design_type}`,
      icon: "🎨",
    },
    requester: {
      name: order.requester.full_name,
      department: order.requester.department || order.entity?.name,
    },
    quantity: undefined,
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: true, // Design orders typically require approval
  };
}

function mapPrintOrderToListSummary(order: BackendPrintOrderResponse): OrderSummary {
  return {
    id: order.id,
    orderCode: order.order_code,
    service: {
      id: `print-${order.print_type}`,
      name: `خدمة الطباعة - ${order.print_type}`,
      slug: `print-${order.print_type}`,
      icon: "🖨️",
    },
    requester: {
      name: order.requester.full_name,
      department: order.requester.department || order.entity?.name,
    },
    quantity: order.quantity,
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: true, // Print orders typically require approval
  };
}

function mapBackendOrderToDetail(order: BackendOrderDetailResponse): OrderDetail {
  // Extract quantity from field_values
  const quantityField = order.field_values.find(
    (fv) => fv.field_key === "quantity" || fv.field_label.includes("الكمية")
  );
  const quantity = quantityField?.value ? Number(quantityField.value) : undefined;

  return {
    id: order.id,
    orderCode: order.order_code,
    orderType: "order",
    service: {
      id: order.service.id,
      name: order.service.name,
      slug: order.service.slug,
      icon: order.service.icon,
    },
    requester: {
      name: order.requester?.full_name || "غير معروف",
      department: order.requester?.department || order.department || "",
    },
    quantity,
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: order.requires_approval,
    fieldValues: (order.field_values || []).map((fv) => ({
      id: fv.id,
      fieldId: fv.field,
      label: fv.field_label,
      key: fv.field_key,
      value: fv.value,
    })),
    attachments: (order.attachments || []).map((att) => {
      // Construct full URL for file attachments
      let url = att.link_url || "#";
      if (att.file) {
        // If file path is relative, construct full URL
        if (att.file.startsWith("http")) {
          url = att.file;
        } else {
          // Remove leading slash if present, then construct URL
          const filePath = att.file.startsWith("/") ? att.file.slice(1) : att.file;
          url = `${API_BASE_URL.replace("/api", "")}/media/${filePath}`;
        }
      }
      return {
        id: att.id,
        type: att.attachment_type || "file",
        name: att.name,
        url,
        sizeKb: att.size_bytes ? Math.round(att.size_bytes / 1024) : undefined,
      };
    }),
    approvals: (order.approvals || []).map((app) => ({
      id: app.id,
      approver: app.approver?.full_name,
      step: app.step,
      decision: app.decision,
      comment: app.comment,
      decidedAt: app.decided_at,
    })),
    statusHistory: (order.status_history || []).map((entry) => ({
      id: entry.id,
      status: entry.status as OrderStatus,
      note: entry.note,
      updatedBy: entry.changed_by?.full_name || "النظام",
      updatedAt: entry.changed_at,
    })),
  };
}

function mapOrderDetailToSummary(order: OrderDetail): OrderSummary {
  return {
    id: order.id,
    orderCode: order.orderCode,
    service: order.service,
    requester: order.requester,
    quantity: order.quantity,
    status: order.status,
    priority: order.priority,
    submittedAt: order.submittedAt,
    requiresApproval: order.requiresApproval,
  };
}

// Entities API
export type EntityLevel = "vice_rectorate" | "college_deanship" | "department_unit";

export interface Entity {
  id: string;
  name: string;
  code?: string;
  level: EntityLevel;
  parent?: {
    id: string;
    name: string;
  } | null;
  is_active: boolean;
  description?: string;
}

export async function fetchEntities(isActiveOnly: boolean = true): Promise<Entity[]> {
  try {
    const url = isActiveOnly 
      ? "/entities/entities/?is_active=true" 
      : "/entities/entities/";
    const response = await apiFetch<any>(url);
    // Handle paginated response
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching entities:", error);
    return [];
  }
}

export async function fetchEntityTree() {
  try {
    const response = await apiFetch<any>("/entities/entities/tree/");
    // Handle paginated response
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching entity tree:", error);
    return [];
  }
}

export async function fetchEntityDetail(id: string) {
  try {
    return await apiFetch(`/entities/entities/${id}/`);
  } catch (error) {
    console.error("Error fetching entity detail:", error);
    throw error;
  }
}

export async function createEntity(data: {
  name: string;
  code?: string;
  level: string;
  parent?: string | null;
  is_active?: boolean;
  description?: string;
}) {
  return apiFetch("/entities/entities/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEntity(
  id: string,
  data: {
    name?: string;
    code?: string;
    level?: string;
    parent?: string | null;
    is_active?: boolean;
    description?: string;
  }
) {
  return apiFetch(`/entities/entities/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEntity(id: string) {
  return apiFetch(`/entities/entities/${id}/`, {
    method: "DELETE",
  });
}

// Users API
// User interface is imported from ./types to avoid duplication

export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await apiFetch<any>("/accounts/users/");
    // Handle paginated response
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function fetchUserDetail(id: string): Promise<User> {
  return apiFetch<User>(`/accounts/users/${id}/`);
}

export async function createUser(data: {
  email: string;
  full_name: string;
  department?: string;
  phone_number?: string;
  role: string;
  entity?: string | null;
  is_active?: boolean;
  password: string;
}): Promise<User> {
  return apiFetch<User>("/accounts/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: {
    full_name?: string;
    department?: string;
    phone_number?: string;
    role?: string;
    entity?: string | null;
    is_active?: boolean;
    password?: string;
  }
): Promise<User> {
  return apiFetch<User>(`/accounts/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Design Orders API
export async function fetchDesignOrders() {
  return apiFetch("/orders/design-orders/");
}

export async function createDesignOrder(data: FormData) {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/orders/design-orders/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
  if (!response.ok) throw new Error("Failed to create design order");
  return response.json();
}

// Print Orders API
export async function fetchPrintOrders() {
  return apiFetch("/orders/print-orders/");
}

export async function createPrintOrder(data: FormData) {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/orders/print-orders/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
  if (!response.ok) throw new Error("Failed to create print order");
  return response.json();
}

// General Orders API (for service forms)
export async function createOrder(data: {
  service: string;
  field_values: Array<{ field: string; value: any }>;
  priority?: string;
  department?: string;
}) {
  return apiFetch("/orders/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Visits API
export interface VisitRequest {
  id: string;
  requester: {
    id: string;
    full_name: string;
    email: string;
  };
  entity?: {
    id: string;
    name: string;
  };
  visit_type: "internal" | "external";
  purpose: string;
  requested_date: string;
  requested_time: string;
  status: "pending" | "approved" | "rejected" | "postponed" | "cancelled" | "completed";
  submitted_at: string;
  approved_at?: string;
  manager_comment?: string;
  permit_file?: string;
}

export interface AvailableDate {
  date: string; // mm/dd/yyyy
  date_iso: string; // YYYY-MM-DD
  available_slots: string[]; // ["09:00", "10:00", ...]
}

export async function fetchVisitRequests(): Promise<VisitRequest[]> {
  try {
    const response = await apiFetch<any>("/visit-requests/");
    // Handle paginated response
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching visit requests:", error);
    return [];
  }
}

export async function fetchAvailableDates(visitType: string = "internal"): Promise<AvailableDate[]> {
  try {
    const response = await apiFetch<{ available_dates: AvailableDate[] }>(
      `/visit-schedules/available_dates/?visit_type=${visitType}`
    );
    return response.available_dates || [];
  } catch (error) {
    console.error("Error fetching available dates:", error);
    return [];
  }
}

export async function fetchAvailableSlots(date: string, visitType: string = "internal"): Promise<string[]> {
  try {
    const response = await apiFetch<{ available_slots: string[] }>(
      `/visit-schedules/available/?date=${date}&visit_type=${visitType}`
    );
    return response.available_slots || [];
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return [];
  }
}

export async function fetchVisitSchedules(date?: string) {
  const url = date ? `/visit-schedules/?date=${date}` : "/visit-schedules/";
  return apiFetch(url);
}

export async function createVisitRequest(data: FormData): Promise<VisitRequest> {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/visit-requests/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create visit request");
  }
  return response.json();
}

// Visit Status Update Functions
export async function approveVisitRequest(id: string, comment?: string): Promise<VisitRequest> {
  return apiFetch<VisitRequest>(`/visit-requests/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify({ comment: comment || "" }),
  });
}

export async function rejectVisitRequest(id: string, comment?: string): Promise<VisitRequest> {
  return apiFetch<VisitRequest>(`/visit-requests/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ comment: comment || "" }),
  });
}

export async function postponeVisitRequest(id: string, newDate: string, comment?: string): Promise<VisitRequest> {
  return apiFetch<VisitRequest>(`/visit-requests/${id}/postpone/`, {
    method: "POST",
    body: JSON.stringify({ new_date: newDate, comment: comment || "" }),
  });
}

export async function fetchVisitRequestDetail(id: string): Promise<VisitRequest> {
  return apiFetch<VisitRequest>(`/visit-requests/${id}/`);
}

// Training API
export async function fetchTrainingRequests() {
  return apiFetch("/training-requests/");
}

export async function createTrainingRequest(data: any) {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/training-requests/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create training request");
  return response.json();
}

// Inventory API
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: "paper" | "ink" | "banner" | "other";
  unit: string;
  current_quantity: number;
  minimum_threshold: number;
  min_quantity: number;
  maximum_threshold: number;
  reorder_point: number;
  last_restocked_at?: string;
  last_usage_at?: string;
  notes?: string;
  status: "critical" | "warning" | "ok";
  created_at: string;
  updated_at: string;
}

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  try {
    const response = await apiFetch<any>("/inventory/items/");
    // Handle paginated response (DRF format)
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      // DRF pagination format: { count, next, previous, results: [...] }
      return response.results;
    }
    console.warn("Unexpected inventory items response format:", response);
    return [];
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }
}

export async function fetchInventoryItem(id: string): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/inventory/items/${id}/`);
}

export async function createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  return apiFetch<InventoryItem>("/inventory/items/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/inventory/items/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteInventoryItem(id: string): Promise<void> {
  return apiFetch<void>(`/inventory/items/${id}/`, {
    method: "DELETE",
  });
}

export async function adjustInventoryItem(
  id: string,
  data: { operation: "in" | "out" | "adjust"; quantity: number; note?: string; reference_order?: string }
): Promise<any> {
  return apiFetch<any>(`/inventory/items/${id}/adjust/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Inventory Logs API
export interface InventoryLog {
  id: string;
  item: {
    id: string;
    name: string;
    sku: string;
  };
  operation: "in" | "out" | "adjust";
  quantity: number;
  balance_after: number;
  performed_by: {
    id: string;
    full_name: string;
  };
  note?: string;
  reference_order?: string;
  created_at: string;
}

export async function fetchInventoryLogs(): Promise<InventoryLog[]> {
  try {
    const response = await apiFetch<any>("/inventory/logs/");
    return extractArrayFromResponse<InventoryLog>(response);
  } catch (error) {
    console.error("Error fetching inventory logs:", error);
    return [];
  }
}

// Reorder Requests API
export interface ReorderRequest {
  id: string;
  item: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  status: "pending" | "ordered" | "received" | "cancelled";
  requested_by: {
    id: string;
    full_name: string;
  };
  requested_at: string;
  approved_by?: {
    id: string;
    full_name: string;
  };
  approved_at?: string;
  received_at?: string;
  notes?: string;
}

export async function fetchReorderRequests(): Promise<ReorderRequest[]> {
  try {
    const response = await apiFetch<any>("/inventory/reorders/");
    return extractArrayFromResponse<ReorderRequest>(response);
  } catch (error) {
    console.error("Error fetching reorder requests:", error);
    return [];
  }
}

export async function approveReorderRequest(id: string): Promise<ReorderRequest> {
  return apiFetch<ReorderRequest>(`/inventory/reorders/${id}/approve/`, {
    method: "POST",
  });
}

export async function markReorderRequestReceived(id: string): Promise<ReorderRequest> {
  return apiFetch<ReorderRequest>(`/inventory/reorders/${id}/mark_received/`, {
    method: "POST",
  });
}

// Services API
export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category: "documents" | "design" | "marketing" | "medical" | "general";
  is_active: boolean;
  requires_approval: boolean;
  fields?: ServiceField[];
  pricing?: ServicePricing[];
  created_at: string;
  updated_at: string;
}

export interface ServiceField {
  id: string;
  key: string;
  label: string;
  field_type: "text" | "number" | "radio" | "textarea" | "file" | "link";
  order: number;
  is_required: boolean;
  is_visible: boolean;
  placeholder?: string;
  help_text?: string;
  config?: any;
  options?: ServiceFieldOption[];
}

export interface ServiceFieldOption {
  id: string;
  label: string;
  value: string;
  is_active: boolean;
  order: number;
}

export async function fetchService(id: string): Promise<Service> {
  return apiFetch<Service>(`/catalog/services/${id}/`);
}

export async function updateServiceApproval(serviceId: string, requiresApproval: boolean): Promise<Service> {
  return apiFetch<Service>(`/catalog/services/${serviceId}/update_approval/`, {
    method: "PATCH",
    body: JSON.stringify({ requires_approval: requiresApproval }),
  });
}

export async function createService(data: Partial<Service>): Promise<Service> {
  return apiFetch<Service>("/catalog/services/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateService(
  id: string,
  data: Partial<Service>
): Promise<Service> {
  return apiFetch<Service>(`/catalog/services/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: string): Promise<void> {
  return apiFetch<void>(`/catalog/services/${id}/`, {
    method: "DELETE",
  });
}

// Service Fields API
export async function fetchServiceFields(serviceId?: string): Promise<ServiceField[]> {
  try {
    const url = serviceId ? `/catalog/service-fields/?service=${serviceId}` : "/catalog/service-fields/";
    console.log("Fetching service fields from:", url);
    const response = await apiFetch<any>(url);
    console.log("Service fields API response:", response);
    // Handle paginated response
    if (Array.isArray(response)) {
      console.log("Returning array of fields:", response.length);
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      console.log("Returning paginated results:", response.results.length);
      return response.results;
    }
    console.warn("Unexpected service fields response format:", response);
    return [];
  } catch (error: any) {
    console.error("Error fetching service fields:", error);
    console.error("Error details:", error.message, error.status);
    throw error; // Re-throw to let the component handle it
  }
}

export async function fetchServiceField(id: string): Promise<ServiceField> {
  return apiFetch<ServiceField>(`/catalog/service-fields/${id}/`);
}

export async function createServiceField(data: Partial<ServiceField>): Promise<ServiceField> {
  return apiFetch<ServiceField>("/catalog/service-fields/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateServiceField(
  id: string,
  data: Partial<ServiceField>
): Promise<ServiceField> {
  return apiFetch<ServiceField>(`/catalog/service-fields/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteServiceField(id: string): Promise<void> {
  return apiFetch<void>(`/catalog/service-fields/${id}/`, {
    method: "DELETE",
  });
}

// Service Pricing API
export interface ServicePricing {
  id: string;
  service: string;
  service_name?: string;
  internal_cost: number;
  external_cost: number;
  notes?: string;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
}

export async function fetchServicePricing(serviceId?: string): Promise<ServicePricing[]> {
  try {
    const url = serviceId ? `/catalog/service-pricing/?service=${serviceId}` : "/catalog/service-pricing/";
    const response = await apiFetch<any>(url);
    // Handle paginated response
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching service pricing:", error);
    return [];
  }
}

export async function fetchServicePricingDetail(id: string): Promise<ServicePricing> {
  return apiFetch<ServicePricing>(`/catalog/service-pricing/${id}/`);
}

export async function createServicePricing(data: Partial<ServicePricing>): Promise<ServicePricing> {
  return apiFetch<ServicePricing>("/catalog/service-pricing/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateServicePricing(
  id: string,
  data: Partial<ServicePricing>
): Promise<ServicePricing> {
  return apiFetch<ServicePricing>(`/catalog/service-pricing/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteServicePricing(id: string): Promise<void> {
  return apiFetch<void>(`/catalog/service-pricing/${id}/`, {
    method: "DELETE",
  });
}

// Notifications API
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/notifications/");
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/mark_read/`, {
    method: "POST",
  });
}

export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/notifications/mark_all_as_read/", {
    method: "POST",
  });
}

// Orders API - Update and Delete
export async function updateOrder(
  id: string,
  data: Partial<OrderDetail>
): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  return apiFetch<void>(`/orders/${id}/`, {
    method: "DELETE",
  });
}

// Visits API - Update and Delete
export async function updateVisitRequest(
  id: string,
  data: FormData
): Promise<any> {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/visit-requests/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
  if (!response.ok) throw new Error("Failed to update visit request");
  return response.json();
}

export async function deleteVisitRequest(id: string): Promise<void> {
  return apiFetch<void>(`/visit-requests/${id}/`, {
    method: "DELETE",
  });
}

// Training API - Update and Delete
export async function updateTrainingRequest(
  id: string,
  data: any
): Promise<any> {
  return apiFetch<any>(`/training-requests/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTrainingRequest(id: string): Promise<void> {
  return apiFetch<void>(`/training-requests/${id}/`, {
    method: "DELETE",
  });
}

// User Settings API
export interface NotificationPreference {
  email_notifications: boolean;
  in_app_notifications: boolean;
  order_status_updates: boolean;
  approval_requests: boolean;
  inventory_alerts: boolean;
  weekly_summary: boolean;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreference> {
  return apiFetch<NotificationPreference>("/notification-preferences/");
}

export async function updateNotificationPreferences(
  data: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  return apiFetch<NotificationPreference>("/notification-preferences/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateUserProfile(data: Partial<User>): Promise<User> {
  return apiFetch<User>("/accounts/users/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: {
  old_password: string;
  new_password: string;
}): Promise<void> {
  return apiFetch<void>("/accounts/users/change_password/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// System Settings API
export interface FieldSetting {
  id: string;
  service_id: string;
  service_name: string;
  key: string;
  label: string;
  field_type: string;
  order: number;
  is_required: boolean;
  is_visible: boolean;
  options?: Array<{
    id: string;
    label: string;
    value: string;
    is_active: boolean;
    order: number;
  }>;
}

export interface ServiceSetting {
  id: string;
  name: string;
  slug: string;
  category: string;
  is_active: boolean;
  description?: string;
}

export async function fetchFieldSettings(): Promise<FieldSetting[]> {
  return apiFetch<FieldSetting[]>("/system/field-settings/list/");
}

export async function updateFieldSetting(
  fieldId: string,
  data: Partial<FieldSetting>
): Promise<any> {
  return apiFetch<any>(`/system/field-settings/update/${fieldId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchServiceSettings(): Promise<ServiceSetting[]> {
  return apiFetch<ServiceSetting[]>("/system/service-settings/list/");
}

export async function updateServiceSetting(
  serviceId: string,
  data: Partial<ServiceSetting>
): Promise<any> {
  return apiFetch<any>(`/system/service-settings/update/${serviceId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Dashboard Stats API
export interface DashboardStats {
  active_orders: number;
  pending_approvals: number;
  inventory_alerts: number;
  savings_percentage: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Try to fetch from admin overview API first
    const adminStats = await apiFetch<DashboardStats>("/admin/overview/stats/");
    return adminStats;
  } catch (error) {
    // Fallback to client-side calculation if API fails
    console.warn("Admin overview API not available, using fallback calculation");
    const [orders, inventory] = await Promise.all([
      fetchOrders().catch(() => []),
      fetchInventoryItems().catch(() => []),
    ]);
    
    // Ensure orders is an array
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    // Ensure inventory is an array
    const inventoryArray = Array.isArray(inventory) ? inventory : [];
    
    const activeOrders = ordersArray.filter((o: any) => 
      o.status !== "completed" && o.status !== "rejected" && o.status !== "archived"
    ).length;
    
    const pendingApprovals = ordersArray.filter((o: any) => 
      o.status === "pending" || o.status === "in_review"
    ).length;
    
    const inventoryAlerts = inventoryArray.filter((item: InventoryItem) => 
      item.current_quantity <= (item.min_quantity || 0)
    ).length;
    
    return {
      active_orders: activeOrders,
      pending_approvals: pendingApprovals,
      inventory_alerts: inventoryAlerts,
      savings_percentage: 0, // Will be calculated by backend
    };
  }
}

// Reports API
export async function fetchOrdersReport(params?: {
  entity?: string;
  college?: string;
  vice_rectorate?: string;
  start_date?: string;
  end_date?: string;
  order_type?: "design" | "print" | "general";
}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }
  const url = `/admin/reports/orders/${queryParams.toString() ? `?${queryParams}` : ""}`;
  return apiFetch<any>(url);
}

export async function fetchProductivityReport(date?: string): Promise<any> {
  const url = date ? `/admin/reports/productivity/?date=${date}` : "/admin/reports/productivity/";
  return apiFetch<any>(url);
}

export async function fetchInventoryReport(): Promise<any> {
  return apiFetch<any>("/admin/reports/inventory/");
}

export async function fetchROIReport(): Promise<any> {
  return apiFetch<any>("/admin/reports/roi/");
}

// Audit Logs API
export interface AuditLog {
  id: string;
  action: string;
  actor: string | null;
  actor_name?: string;
  actor_email?: string;
  severity: "info" | "success" | "warning" | "danger";
  metadata?: any;
  created_at: string;
}

export async function fetchAuditLogs(params?: {
  search?: string;
  actor?: string;
  start_date?: string;
  end_date?: string;
  severity?: "info" | "success" | "warning" | "danger";
}): Promise<AuditLog[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const url = `/system/audit-log/${queryParams.toString() ? `?${queryParams}` : ""}`;
    const response = await apiFetch<any>(url);
    // Handle paginated response
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

// Approval Policy API
export interface ApprovalPolicy {
  mode: "all" | "selective" | "none";
  selective_services: string[];
}

export async function fetchApprovalPolicy(): Promise<ApprovalPolicy> {
  try {
    // Try the new endpoint first
    return await apiFetch<ApprovalPolicy>("/system/approval-policy/current/");
  } catch (error) {
    // Fallback: try to get by ID (if we have one)
    console.warn("Failed to fetch approval policy from current endpoint:", error);
    // Return default policy
    return {
      mode: "selective",
      selective_services: [],
    };
  }
}

export async function updateApprovalPolicy(data: Partial<ApprovalPolicy>): Promise<ApprovalPolicy> {
  return apiFetch<ApprovalPolicy>("/system/approval-policy/current/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchPendingOrders(): Promise<OrderSummary[]> {
  const orders = await fetchOrders();
  return orders.filter((o: any) => o.status === "pending" || o.status === "in_review");
}


