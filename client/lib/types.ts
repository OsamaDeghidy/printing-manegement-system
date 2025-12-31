export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'consumer' | 'print_manager' | 'dept_manager' | 'dept_employee' | 'training_supervisor' | 'inventory' | 'admin' | 'approver' | 'staff' | 'requester';
  entity?: {
    id: string;
    name: string;
    code?: string;
    level?: string;
  };
  department?: string;
  phone_number?: string;
  is_active: boolean; // Changed to required to match API response
  date_joined?: string;
  last_login?: string;
}

