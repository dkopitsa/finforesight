import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'finforesight_access_token';
  private readonly REFRESH_TOKEN_KEY = 'finforesight_refresh_token';
  private readonly USER_KEY = 'finforesight_user';
  private readonly SCHEDULER_VIEW_MODE_KEY = 'finforesight_scheduler_view_mode';

  // Token management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  // User management
  getUser(): any | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Scheduler view mode management
  getSchedulerViewMode(): string | null {
    return localStorage.getItem(this.SCHEDULER_VIEW_MODE_KEY);
  }

  setSchedulerViewMode(mode: string): void {
    localStorage.setItem(this.SCHEDULER_VIEW_MODE_KEY, mode);
  }

  // Clear all storage
  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
