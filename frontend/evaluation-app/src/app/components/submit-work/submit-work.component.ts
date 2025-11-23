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

  // Committee check
  hasCommittee = true;
  committeeSuggestions: any[] = [];
  showCommitteeWarning = false;
  addingCommittee = false;

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
    this.checkCommitteeCoverage();
  }

  checkCommitteeCoverage(): void {
    if (!this.currentUser?.PARENTORG) return;

    this.apiService.checkCommitteeCoverage(this.currentUser.PARENTORG).subscribe({
      next: (data) => {
        this.hasCommittee = data.hasCommittee;
        if (!this.hasCommittee) {
          this.loadCommitteeSuggestions();
        }
      }
    });
  }

  loadCommitteeSuggestions(): void {
    if (!this.currentUser?.PARENTORG) return;

    this.apiService.getCommitteeSuggestions(this.currentUser.PARENTORG).subscribe({
      next: (data) => {
        this.committeeSuggestions = data.filter((e: any) => !e.isAlreadyCommittee);
      }
    });
  }

  addCommitteeMember(employee: any): void {
    if (!this.currentUser) return;

    this.addingCommittee = true;
    this.apiService.addCommitteeMember({
      employeePernr: employee.PERNR,
      committeeStage: 'PRE_FINAL',
      parentorgFilter: this.currentUser.PARENTORG
    }).subscribe({
      next: () => {
        this.hasCommittee = true;
        this.showCommitteeWarning = false;
        this.addingCommittee = false;
        alert(`เพิ่ม ${employee.ENAME} เป็นคณะกรรมการกลั่นกรองเรียบร้อยแล้ว`);
      },
      error: (err) => {
        this.addingCommittee = false;
        alert('เกิดข้อผิดพลาด: ' + (err.error?.error || err.message));
      }
    });
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

    // Check committee coverage first
    if (!this.hasCommittee) {
      this.showCommitteeWarning = true;
      return;
    }

    this.doSubmit();
  }

  doSubmit(): void {
    if (!this.currentUser) return;

    this.submitting = true;
    this.showCommitteeWarning = false;

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

  closeWarning(): void {
    this.showCommitteeWarning = false;
  }
}
