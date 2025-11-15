import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Check if user is already logged in
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.storageService.getToken();
    const user = this.storageService.getUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.storageService.setToken(response.access_token);
        this.storageService.setRefreshToken(response.refresh_token);
        this.storageService.setUser(response.user);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.apiService.post<RegisterResponse>('/auth/register', data).pipe(
      tap((response) => {
        this.storageService.setToken(response.access_token);
        this.storageService.setRefreshToken(response.refresh_token);
        this.storageService.setUser(response.user);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout(): void {
    const refreshToken = this.storageService.getRefreshToken();

    if (refreshToken) {
      // Call logout API (optional - backend can handle token revocation)
      this.apiService.post('/auth/logout', { refresh_token: refreshToken }).subscribe({
        complete: () => {
          this.clearAuthData();
        },
        error: () => {
          // Clear local data even if API call fails
          this.clearAuthData();
        },
      });
    } else {
      this.clearAuthData();
    }
  }

  private clearAuthData(): void {
    this.storageService.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    this.storageService.setUser(user);
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }
}
