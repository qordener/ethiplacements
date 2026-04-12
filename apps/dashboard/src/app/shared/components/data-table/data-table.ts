import { Component, input, output, signal, computed } from '@angular/core';

export interface TableColumn<T> {
  key:      keyof T;
  label:    string;
  sortable?: boolean;
  numeric?:  boolean;
}

export interface SortEvent<T> {
  key:       keyof T;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'epi-data-table',
  standalone: true,
  template: `
    <div class="data-table-wrapper">
      @if (loading()) {
        <div data-testid="table-loading" class="data-table__loading" role="status">
          Chargement…
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  scope="col"
                  [class.col--numeric]="col.numeric"
                  [class.col--sorted]="sortKey() === col.key"
                  [attr.aria-sort]="getAriaSort(col)"
                >
                  @if (col.sortable) {
                    <button
                      data-testid="sort-btn"
                      class="data-table__sort-btn"
                      type="button"
                      (click)="onSort(col)"
                    >
                      {{ col.label }}
                      <span class="data-table__sort-icon" aria-hidden="true">
                        {{ getSortIcon(col) }}
                      </span>
                    </button>
                  } @else {
                    {{ col.label }}
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (rows().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length">
                  <div data-testid="table-empty" class="data-table__empty">
                    Aucune donnée à afficher.
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of rows(); track $index) {
                <tr data-testid="table-row" class="data-table__row">
                  @for (col of columns(); track col.key) {
                    <td [class.col--numeric]="col.numeric">
                      {{ row[col.key] ?? '—' }}
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .data-table-wrapper {
      width: 100%;
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm, 0.875rem);
    }

    .data-table th {
      text-align: left;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-muted, #4a4a6a);
      border-bottom: 2px solid var(--color-border, #e8e8f0);
      white-space: nowrap;
    }

    .data-table td {
      padding: var(--space-3, 12px);
      border-bottom: 1px solid var(--color-surface-alt, #f0f0f8);
      color: var(--color-text, #1a1a2e);
    }

    .data-table__row:hover td {
      background: var(--color-surface-alt, #f0f0f8);
    }

    .col--numeric {
      text-align: right;
      font-family: var(--font-mono, monospace);
    }

    .col--sorted {
      color: var(--color-primary, #2d6a4f);
    }

    .data-table__sort-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1, 4px);
    }

    .data-table__sort-btn:hover {
      color: var(--color-primary, #2d6a4f);
    }

    .data-table__sort-icon {
      font-size: var(--text-xs, 0.75rem);
    }

    .data-table__empty {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-text-subtle, #6a6a8a);
      font-style: italic;
    }

    .data-table__loading {
      padding: var(--space-8, 32px);
      text-align: center;
      color: var(--color-text-muted, #4a4a6a);
    }
  `],
})
export class DataTable<T extends object> {
  columns = input.required<TableColumn<T>[]>();
  rows    = input.required<T[]>();
  loading = input<boolean>(false);

  sortChange = output<SortEvent<T>>();

  sortKey       = signal<keyof T | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  onSort(col: TableColumn<T>) {
    if (!col.sortable) return;

    if (this.sortKey() === col.key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDirection.set('asc');
    }

    this.sortChange.emit({ key: col.key, direction: this.sortDirection() });
  }

  getAriaSort(col: TableColumn<T>): string | null {
    if (this.sortKey() !== col.key) return null;
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  getSortIcon(col: TableColumn<T>): string {
    if (this.sortKey() !== col.key) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}
