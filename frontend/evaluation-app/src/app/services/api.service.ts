import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Employees
  getEmployees(search?: string, page?: number, limit?: number): Observable<any> {
    let url = `${this.baseUrl}/employees?`;
    if (search) url += `search=${search}&`;
    if (page) url += `page=${page}&`;
    if (limit) url += `limit=${limit}`;
    return this.http.get(url);
  }

  getEmployee(pernr: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${pernr}`);
  }

  getChainOfCommand(pernr: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${pernr}/chain`);
  }

  getLoginOptions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/login/options`);
  }

  // Work Results
  getWorkResults(filters?: any): Observable<any> {
    let url = `${this.baseUrl}/work-results?`;
    if (filters) {
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.employeePernr) url += `employeePernr=${filters.employeePernr}&`;
      if (filters.evaluatorPernr) url += `evaluatorPernr=${filters.evaluatorPernr}`;
    }
    return this.http.get(url);
  }

  getPendingEvaluations(evaluatorPernr: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/work-results/pending/${evaluatorPernr}`);
  }

  createWorkResult(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/work-results`, data);
  }

  getWorkResult(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/work-results/${id}`);
  }

  evaluateWorkResult(id: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/work-results/${id}/evaluate`, data);
  }

  getEvaluationHistory(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/work-results/${id}/evaluations`);
  }

  // Committee
  getCommitteeMembers(stage?: string): Observable<any> {
    let url = `${this.baseUrl}/committee`;
    if (stage) url += `?stage=${stage}`;
    return this.http.get(url);
  }

  addCommitteeMember(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/committee`, data);
  }

  removeCommitteeMember(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/committee/${id}`);
  }

  getCommitteeSuggestions(parentorg: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/committee/suggestions/${encodeURIComponent(parentorg)}`);
  }

  checkCommitteeCoverage(parentorg: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/committee/check/${encodeURIComponent(parentorg)}`);
  }

  getAllCommitteeCoverage(): Observable<any> {
    return this.http.get(`${this.baseUrl}/committee/coverage`);
  }

  // Dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/stats`);
  }

  getUserStats(pernr: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/stats/${pernr}`);
  }

  // Reset
  resetData(): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset`, {});
  }
}
