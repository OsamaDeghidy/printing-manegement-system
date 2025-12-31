import { headers } from "next/headers";
import {
  mockOrders,
  type OrderDetail,
  type OrderSummary,
  type OrderStatus,
} from "@/data/orders";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api";

/**
 * Get authentication headers from request headers (server-side)
 * Note: Since tokens are stored in localStorage (client-side), we can't access them here.
 * The API call will work if the backend allows unauthenticated requests or uses session-based auth.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headersList = await headers();
  // Try to get Authorization header from incoming request
  const authHeader = headersList.get("authorization");
  
  const headersObj: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (authHeader) {
    headersObj.Authorization = authHeader;
  }
  
  return headersObj;
}

/**
 * Generic API fetch function for server-side (no localStorage access)
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: init?.cache ?? "no-store",
  });

  if (!response.ok) {
    // Try to get error details from response
    let errorMessage = `API request failed (${response.status} ${response.statusText})`;
    try {
      const errorData = await response.clone().json();
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.join(", ");
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If response is not JSON, use status text
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    throw error;
  }

  return (await response.json()) as T;
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

/**
 * Fetch orders from backend API (server-side)
 * Fetches all order types: regular orders, design orders, and print orders
 */
export async function fetchOrders(): Promise<OrderSummary[]> {
  try {
    // Fetch all order types: regular orders, design orders, and print orders
    const [regularOrders, designOrders, printOrders] = await Promise.allSettled([
      apiFetch<BackendOrderListResponse[]>("/orders/orders/").catch(() => []),
      apiFetch<BackendDesignOrderResponse[]>("/orders/design-orders/").catch(() => []),
      apiFetch<BackendPrintOrderResponse[]>("/orders/print-orders/").catch(() => []),
    ]);

    const allOrders: OrderSummary[] = [];

    // Process regular orders
    if (regularOrders.status === "fulfilled" && Array.isArray(regularOrders.value)) {
      allOrders.push(...regularOrders.value.map(mapBackendOrderToListSummary));
    }

    // Process design orders
    if (designOrders.status === "fulfilled" && Array.isArray(designOrders.value)) {
      allOrders.push(...designOrders.value.map(mapDesignOrderToListSummary));
    }

    // Process print orders
    if (printOrders.status === "fulfilled" && Array.isArray(printOrders.value)) {
      allOrders.push(...printOrders.value.map(mapPrintOrderToListSummary));
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

/**
 * Fetch order detail from backend API (server-side)
 * Supports all order types: regular orders, design orders, and print orders
 */
export async function fetchOrderDetail(orderCode: string): Promise<OrderDetail | undefined> {
  try {
    // Try regular orders first
    try {
      const orders = await apiFetch<BackendOrderDetailResponse[]>("/orders/orders/");
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
      const designOrders = await apiFetch<BackendDesignOrderResponse[]>("/orders/design-orders/");
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
      const printOrders = await apiFetch<BackendPrintOrderResponse[]>("/orders/print-orders/");
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

function mapDesignOrderToDetail(order: any): OrderDetail {
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
    requiresApproval: true,
    fieldValues: [
      { id: "design-type", fieldId: "design_type", label: "نوع التصميم", key: "design_type", value: order.design_type },
      { id: "title", fieldId: "title", label: "العنوان", key: "title", value: order.title },
      ...(order.size ? [{ id: "size", fieldId: "size", label: "الحجم", key: "size", value: order.size }] : []),
      ...(order.description ? [{ id: "description", fieldId: "description", label: "الوصف", key: "description", value: order.description }] : []),
    ],
    attachments: (order.attachments || []).map((att: any) => {
      let url = att.link_url || "#";
      if (att.file) {
        if (att.file.startsWith("http")) {
          url = att.file;
        } else {
          const filePath = att.file.startsWith("/") ? att.file.slice(1) : att.file;
          url = `${API_BASE_URL.replace("/api", "")}/media/${filePath}`;
        }
      }
      return {
        id: att.id,
        type: att.attachment_type,
        name: att.name,
        url,
        sizeKb: att.size_bytes ? Math.round(att.size_bytes / 1024) : undefined,
      };
    }),
    approvals: [],
    statusHistory: [],
  };
}

function mapPrintOrderToDetail(order: any): OrderDetail {
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
    requiresApproval: true,
    fieldValues: [
      { id: "print-type", fieldId: "print_type", label: "نوع الطباعة", key: "print_type", value: order.print_type },
      ...(order.quantity ? [{ id: "quantity", fieldId: "quantity", label: "الكمية", key: "quantity", value: order.quantity }] : []),
      ...(order.size ? [{ id: "size", fieldId: "size", label: "الحجم", key: "size", value: order.size }] : []),
      ...(order.paper_type ? [{ id: "paper_type", fieldId: "paper_type", label: "نوع الورق", key: "paper_type", value: order.paper_type }] : []),
    ],
    attachments: (order.attachments || []).map((att: any) => {
      let url = att.link_url || "#";
      if (att.file) {
        if (att.file.startsWith("http")) {
          url = att.file;
        } else {
          const filePath = att.file.startsWith("/") ? att.file.slice(1) : att.file;
          url = `${API_BASE_URL.replace("/api", "")}/media/${filePath}`;
        }
      }
      return {
        id: att.id,
        type: att.attachment_type,
        name: att.name,
        url,
        sizeKb: att.size_bytes ? Math.round(att.size_bytes / 1024) : undefined,
      };
    }),
    approvals: [],
    statusHistory: [],
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

function mapBackendOrderToDetail(order: BackendOrderDetailResponse): OrderDetail {
  // Extract quantity from field_values
  const quantityField = order.field_values.find(
    (fv) => fv.field_key === "quantity" || fv.field_label.includes("الكمية")
  );
  const quantity = quantityField?.value ? Number(quantityField.value) : undefined;

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
    quantity,
    status: order.status as OrderStatus,
    priority: order.priority as "low" | "medium" | "high",
    submittedAt: order.submitted_at,
    requiresApproval: order.requires_approval,
    fieldValues: order.field_values.map((fv) => ({
      id: fv.id,
      fieldId: fv.field,
      label: fv.field_label,
      key: fv.field_key,
      value: fv.value,
    })),
    attachments: order.attachments.map((att) => {
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
        type: att.attachment_type,
        name: att.name,
        url,
        sizeKb: att.size_bytes ? Math.round(att.size_bytes / 1024) : undefined,
      };
    }),
    approvals: order.approvals.map((app) => ({
      id: app.id,
      approver: app.approver.full_name,
      step: app.step,
      decision: app.decision,
      comment: app.comment,
      decidedAt: app.decided_at,
    })),
    statusHistory: order.status_history.map((hist) => ({
      id: hist.id,
      status: hist.status as OrderStatus,
      note: hist.note,
      updatedBy: hist.changed_by.full_name,
      updatedAt: hist.changed_at,
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

