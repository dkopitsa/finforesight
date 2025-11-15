export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  currency: string;
}

export interface RegisterResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ProfileUpdate {
  full_name?: string;
  currency?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}
