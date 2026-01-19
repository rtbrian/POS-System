export interface User {
    id: number;
    email: string;
    password_hash: string;
    role_id: number;
    business_id: number;
    created_at: Date;
  }