export interface User {
  id: number;
  username: string;
  pin: string;
  role: 'admin' | 'staff';
  created_at?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  created_at?: string;
  total_debt?: number; // Calculated dynamically in backend
  total_payment?: number; // Calculated dynamically in backend
  net_balance?: number; // Calculated dynamically in backend
}

export interface Transaction {
  id: number;
  client_id: number;
  client_name?: string; // Loaded via client_id
  type: 'debt' | 'payment'; // دين أو سداد
  amount: number;
  date: string;
  description: string;
  created_at?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  username: string;
  action_type: string;
  details: string;
  ip_address?: string;
  timestamp: string;
}

export interface Permissions {
  user_id: number;
  allow_add: boolean;
  allow_edit: boolean;
  allow_delete: boolean;
  allow_stats: boolean;
  allow_db: boolean;
}
