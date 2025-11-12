import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-placeholder">
      <h2>Scheduler</h2>
      <p>Scheduled transactions coming in Week 4</p>
    </div>
  `,
  styles: [`
    .page-placeholder {
      padding: 24px;
    }

    h2 {
      margin: 0 0 16px 0;
      color: #262626;
      font-size: 24px;
    }

    p {
      color: #595959;
      font-size: 14px;
    }
  `]
})
export class SchedulerComponent {}
