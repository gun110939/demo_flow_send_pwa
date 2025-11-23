import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SubmitWorkComponent } from './components/submit-work/submit-work.component';
import { PendingEvaluationsComponent } from './components/pending-evaluations/pending-evaluations.component';
import { EvaluateComponent } from './components/evaluate/evaluate.component';
import { WorkDetailComponent } from './components/work-detail/work-detail.component';
import { CommitteeManagementComponent } from './components/committee-management/committee-management.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'submit-work', component: SubmitWorkComponent },
  { path: 'pending-evaluations', component: PendingEvaluationsComponent },
  { path: 'evaluate/:id', component: EvaluateComponent },
  { path: 'work-detail/:id', component: WorkDetailComponent },
  { path: 'committee-management', component: CommitteeManagementComponent }
];
