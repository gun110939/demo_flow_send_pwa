import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  PERNR: number;
  ENAME: string;
  STELL: string;
  PERSK: number;
  ORGEH: string;
  PARENTORG: string;
  MGRPERNR: number;
  committeeRole?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load from localStorage if exists
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this.currentUserSubject.next(JSON.parse(saved));
    }
  }

  login(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isCommitteeMember(): boolean {
    const user = this.currentUserSubject.value;
    return user?.committeeRole !== undefined && user?.committeeRole !== null;
  }

  getCommitteeRole(): string | null {
    return this.currentUserSubject.value?.committeeRole || null;
  }
}
