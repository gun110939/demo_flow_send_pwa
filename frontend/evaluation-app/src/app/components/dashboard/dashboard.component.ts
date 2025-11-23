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
