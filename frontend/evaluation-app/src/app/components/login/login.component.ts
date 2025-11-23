import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  loginOptions: any = null;
  loading = true;
  selectedCategory = 'regularEmployees';

  categories = [
    { key: 'regularEmployees', label: 'พนักงานทั่วไป (ระดับ 1-7)' },
    { key: 'managers', label: 'หัวหน้างาน/ผู้จัดการ (ระดับ 8-9)' },
    { key: 'executives', label: 'ผู้บริหาร (ระดับ 10+)' },
    { key: 'preFinalCommittee', label: 'คณะกรรมการกลั่นกรอง' },
    { key: 'finalCommittee', label: 'คณะกรรมการลำดับสุดท้าย' }
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLoginOptions();
  }

  loadLoginOptions(): void {
    this.apiService.getLoginOptions().subscribe({
      next: (data) => {
        this.loginOptions = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading login options:', err);
        this.loading = false;
      }
    });
  }

  selectUser(user: any): void {
    this.authService.login(user);
    this.router.navigate(['/dashboard']);
  }

  getCurrentList(): any[] {
    if (!this.loginOptions) return [];
    return this.loginOptions[this.selectedCategory] || [];
  }
}
