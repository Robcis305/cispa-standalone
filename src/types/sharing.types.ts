export interface SharePermissions {
  view: boolean;
  download: boolean;
}

export interface Share {
  share_id: string;
  report_id: string;
  shared_by_user_id: string;
  share_token: string;
  permissions: SharePermissions;
  expiration_date?: string;
  email_restrictions: string[];
  access_count: number;
  last_accessed_at?: string;
  is_active: boolean;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateShareRequest {
  report_id: string;
  permissions: SharePermissions;
  expiration_date?: string;
  email_restrictions?: string[];
}

export interface ShareAccessLog {
  access_id: string;
  share_id: string;
  accessed_at: string;
  ip_address?: string;
  user_agent?: string;
  email?: string;
}