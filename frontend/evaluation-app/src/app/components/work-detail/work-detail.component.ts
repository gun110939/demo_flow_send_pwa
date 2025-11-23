import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-work-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './work-detail.component.html'
})
export class WorkDetailComponent implements OnInit {
  workResult: any = null;
  loading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkResult(id);
    }
  }

  loadWorkResult(id: string): void {
    this.apiService.getWorkResult(id).subscribe({
      next: (data) => {
        this.workResult = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
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
}
