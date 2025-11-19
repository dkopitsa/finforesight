import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { User, ProfileUpdate, PasswordChange } from '../../../core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiService = inject(ApiService);

  updateProfile(data: ProfileUpdate): Observable<User> {
    return this.apiService.put<User>('/auth/profile', data);
  }

  changePassword(data: PasswordChange): Observable<void> {
    return this.apiService.put<void>('/auth/password', data);
  }

  logoutAllDevices(): Observable<void> {
    return this.apiService.post<void>('/auth/logout-all', {});
  }
}
