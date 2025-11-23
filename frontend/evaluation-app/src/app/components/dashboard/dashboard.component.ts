import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  userStats: any = null;
  globalStats: any = null;
  allWorkResults: any[] = [];
  loading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStats();
    this.loadAllWorkResults();
  }

  loadStats(): void {
    if (!this.currentUser) return;

    // Load user stats
    this.apiService.getUserStats(this.currentUser.PERNR).subscribe({
      next: (data) => {
        this.userStats = data;
      }
    });

    // Load global stats
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.globalStats = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadAllWorkResults(): void {
    this.apiService.getWorkResults().subscribe({
      next: (data) => {
        this.allWorkResults = data;
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'รอดำเนินการ';
      case 'APPROVED': return 'อนุมัติแล้ว';
      case 'REJECTED': return 'ไม่อนุมัติ';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  }

  getStageLabel(stage: string): string {
    switch (stage) {
      case 'PRE_FINAL': return 'คณะกรรมการกลั่นกรอง';
      case 'FINAL': return 'คณะกรรมการลำดับสุดท้าย';
      default: return 'สายบังคับบัญชา';
    }
  }

  getStageClass(stage: string): string {
    switch (stage) {
      case 'PRE_FINAL': return 'bg-green-100 text-green-800';
      case 'FINAL': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  resetDemo(): void {
    if (confirm('ต้องการรีเซ็ตข้อมูล Demo หรือไม่?')) {
      this.apiService.resetData().subscribe({
        next: () => {
          alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
          this.loadStats();
        }
      });
    }
  }
}
