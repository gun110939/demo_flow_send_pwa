import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-pending-evaluations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pending-evaluations.component.html'
})
export class PendingEvaluationsComponent implements OnInit {
  currentUser: User | null = null;
  workResults: any[] = [];
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
    this.loadPendingEvaluations();
  }

  loadPendingEvaluations(): void {
    if (!this.currentUser) return;

    this.apiService.getPendingEvaluations(this.currentUser.PERNR).subscribe({
      next: (data) => {
        this.workResults = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStageLabel(stage: string): string {
    switch (stage) {
      case 'PRE_FINAL': return 'กลั่นกรอง';
      case 'FINAL': return 'ลำดับสุดท้าย';
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
}
