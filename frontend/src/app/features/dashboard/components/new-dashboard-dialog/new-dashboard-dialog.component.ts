import { booleanAttribute, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardTypeApi } from '../../models/dashboard-type.model';

export interface NewDashboardDraft {
  readonly title: string;
  readonly type: DashboardTypeApi;
}

@Component({
  selector: 'app-new-dashboard-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-dashboard-dialog.component.html',
  styleUrl: './new-dashboard-dialog.component.scss',
})
export class NewDashboardDialogComponent {
  readonly open = input(false, { transform: booleanAttribute });
  readonly closed = output<void>();
  readonly createDashboard = output<NewDashboardDraft>();

  protected readonly DashboardTypeApi = DashboardTypeApi;
  protected title = 'New dashboard';
  protected pickedType: DashboardTypeApi = DashboardTypeApi.Default;

  pickType(type: DashboardTypeApi): void {
    this.pickedType = type;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  submit(): void {
    const trimmed = this.title.trim();
    if (trimmed === '') {
      return;
    }
    this.createDashboard.emit({
      title: trimmed,
      type: this.pickedType,
    });
  }

  cancel(): void {
    this.closed.emit();
  }
}
