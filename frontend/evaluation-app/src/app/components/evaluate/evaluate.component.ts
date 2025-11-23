import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-evaluate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './evaluate.component.html'
})
export class EvaluateComponent implements OnInit {
  currentUser: User | null = null;
  workResult: any = null;
  loading = true;
  submitting = false;
  submitted = false;
  result: any = null;

  formData = {
    status: 'APPROVED',
    comments: '',
    score: 80
  };

  // Check if this is pre-final stage (needs score)
  get needsScore(): boolean {
    return this.workResult?.committeeStage === 'PRE_FINAL';
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
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

  submit(): void {
    if (!this.currentUser || !this.workResult) return;

    this.submitting = true;

    const data: any = {
      evaluatorPernr: this.currentUser.PERNR,
      status: this.formData.status,
      comments: this.formData.comments
    };

    // Add score if pre-final
    if (this.needsScore && this.formData.status === 'APPROVED') {
      data.score = this.formData.score;
    }

    this.apiService.evaluateWorkResult(this.workResult.id, data).subscribe({
      next: (response) => {
        this.result = response;
        this.submitted = true;
        this.submitting = false;
      },
      error: (err) => {
        alert('เกิดข้อผิดพลาด: ' + err.message);
        this.submitting = false;
      }
    });
  }

  getNextActionLabel(action: string): string {
    switch (action) {
      case 'SENT_TO_NEXT': return 'ส่งต่อไปผู้ประเมินถัดไป';
      case 'SENT_TO_PRE_FINAL': return 'ส่งเข้าคณะกรรมการกลั่นกรอง';
      case 'SENT_TO_FINAL': return 'ส่งเข้าคณะกรรมการลำดับสุดท้าย';
      case 'COMPLETED': return 'อนุมัติเรียบร้อย';
      case 'REJECTED': return 'ไม่อนุมัติ';
      default: return action;
    }
  }
}
