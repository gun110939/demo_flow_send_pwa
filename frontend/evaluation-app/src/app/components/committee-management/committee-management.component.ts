import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-committee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './committee-management.component.html'
})
export class CommitteeManagementComponent implements OnInit {
  currentUser: User | null = null;

  // Committee members
  preFinalCommittee: any[] = [];
  finalCommittee: any[] = [];

  // Coverage view
  coverageList: any[] = [];
  showCoverage = false;

  // Add member modal
  showAddModal = false;
  addStage: 'PRE_FINAL' | 'FINAL' = 'PRE_FINAL';
  selectedParentorg = '';
  suggestions: any[] = [];

  // Search for adding
  searchQuery = '';
  searchResults: any[] = [];
  searching = false;

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
    this.loadCommitteeMembers();
    this.loadCoverage();
  }

  loadCommitteeMembers(): void {
    this.apiService.getCommitteeMembers('PRE_FINAL').subscribe({
      next: (data) => {
        this.preFinalCommittee = data;
      }
    });

    this.apiService.getCommitteeMembers('FINAL').subscribe({
      next: (data) => {
        this.finalCommittee = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadCoverage(): void {
    this.apiService.getAllCommitteeCoverage().subscribe({
      next: (data) => {
        this.coverageList = data;
      }
    });
  }

  removeMember(member: any): void {
    if (confirm(`ต้องการลบ ${member.employee?.ENAME} ออกจากคณะกรรมการหรือไม่?`)) {
      this.apiService.removeCommitteeMember(member.id).subscribe({
        next: () => {
          this.loadCommitteeMembers();
          this.loadCoverage();
        },
        error: (err) => {
          alert('เกิดข้อผิดพลาด: ' + err.message);
        }
      });
    }
  }

  openAddModal(stage: 'PRE_FINAL' | 'FINAL', parentorg?: string): void {
    this.addStage = stage;
    this.selectedParentorg = parentorg || '';
    this.showAddModal = true;
    this.searchQuery = '';
    this.searchResults = [];
    this.suggestions = [];

    if (stage === 'PRE_FINAL' && parentorg) {
      this.loadSuggestions(parentorg);
    }
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.suggestions = [];
  }

  loadSuggestions(parentorg: string): void {
    this.apiService.getCommitteeSuggestions(parentorg).subscribe({
      next: (data) => {
        this.suggestions = data;
      }
    });
  }

  searchEmployee(): void {
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searching = true;
    this.apiService.getEmployees(this.searchQuery, 1, 20).subscribe({
      next: (data) => {
        this.searchResults = data.data;
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      }
    });
  }

  addMember(employee: any): void {
    const data: any = {
      employeePernr: employee.PERNR,
      committeeStage: this.addStage
    };

    if (this.addStage === 'PRE_FINAL') {
      data.parentorgFilter = this.selectedParentorg || employee.PARENTORG;
    }

    this.apiService.addCommitteeMember(data).subscribe({
      next: () => {
        this.loadCommitteeMembers();
        this.loadCoverage();
        this.closeAddModal();
        alert(`เพิ่ม ${employee.ENAME} เป็นคณะกรรมการเรียบร้อยแล้ว`);
      },
      error: (err) => {
        alert('เกิดข้อผิดพลาด: ' + (err.error?.error || err.message));
      }
    });
  }

  getUncoveredOrgs(): any[] {
    return this.coverageList.filter(c => !c.hasCommittee);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
