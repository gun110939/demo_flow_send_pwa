import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  loginOptions: any = null;
  loading = true;
  selectedCategory = 'regularEmployees';

  // Search functionality
  searchMode = false;
  searchQuery = '';
  searchResults: any[] = [];
  searching = false;

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

  // Search functions
  toggleSearchMode(): void {
    this.searchMode = !this.searchMode;
    if (!this.searchMode) {
      this.searchQuery = '';
      this.searchResults = [];
    }
  }

  search(): void {
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searching = true;
    this.apiService.getEmployees(this.searchQuery, 1, 50).subscribe({
      next: (data) => {
        this.searchResults = data.data;
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      }
    });
  }

  onSearchKeyup(): void {
    // Debounce search
    if (this.searchQuery.length >= 2) {
      this.search();
    } else {
      this.searchResults = [];
    }
  }

  resetDemo(): void {
    if (confirm('ต้องการรีเซ็ตข้อมูล Demo ทั้งหมดหรือไม่?\n\n- ผลงานทั้งหมดจะถูกลบ\n- คณะกรรมการจะถูก Random ใหม่\n- สร้างผลงานตัวอย่าง 10 ชิ้นใหม่')) {
      this.apiService.resetData().subscribe({
        next: () => {
          alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว\nพร้อมสำหรับ Demo ใหม่');
          this.loadLoginOptions();
        },
        error: (err) => {
          alert('เกิดข้อผิดพลาด: ' + err.message);
        }
      });
    }
  }
}
