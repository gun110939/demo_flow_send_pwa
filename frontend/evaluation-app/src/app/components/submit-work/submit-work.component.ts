import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-submit-work',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './submit-work.component.html'
})
export class SubmitWorkComponent implements OnInit {
  currentUser: User | null = null;
  chain: any[] = [];
  loading = false;
  submitting = false;
  submitted = false;
  result: any = null;

  formData = {
    title: '',
    description: ''
  };

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
    this.loadChain();
  }

  loadChain(): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.apiService.getChainOfCommand(this.currentUser.PERNR).subscribe({
      next: (data) => {
        this.chain = data.slice(1); // Remove self from chain
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (!this.currentUser || !this.formData.title) return;

    this.submitting = true;
    this.apiService.createWorkResult({
      employeePernr: this.currentUser.PERNR,
      title: this.formData.title,
      description: this.formData.description
    }).subscribe({
      next: (data) => {
        this.result = data;
        this.submitted = true;
        this.submitting = false;
      },
      error: (err) => {
        alert('เกิดข้อผิดพลาด: ' + err.message);
        this.submitting = false;
      }
    });
  }
}
