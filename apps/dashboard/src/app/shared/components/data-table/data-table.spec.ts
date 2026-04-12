import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTable, TableColumn } from './data-table';

interface MockRow {
  id: string;
  name: string;
  value: number;
  score: number | null;
}

const COLUMNS: TableColumn<MockRow>[] = [
  { key: 'name',  label: 'Nom',    sortable: true  },
  { key: 'value', label: 'Valeur', sortable: true, numeric: true },
  { key: 'score', label: 'Score',  sortable: false },
];

const ROWS: MockRow[] = [
  { id: '1', name: 'Danone',  value: 1500, score: 72 },
  { id: '2', name: 'Arkéa',   value: 800,  score: 55 },
  { id: '3', name: 'Engie',   value: 2000, score: null },
];

describe('DataTable', () => {
  let fixture: ComponentFixture<DataTable<MockRow>>;
  let component: DataTable<MockRow>;

  async function setup(rows: MockRow[] = ROWS, loading = false) {
    await TestBed.configureTestingModule({
      imports: [DataTable],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTable<MockRow>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ─── En-têtes ─────────────────────────────────────────────────────────────────

  describe('en-têtes de colonnes', () => {
    it('should render one header cell per column', async () => {
      await setup();
      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers).toHaveLength(COLUMNS.length);
    });

    it('should display column labels in headers', async () => {
      await setup();
      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers[0].textContent).toContain('Nom');
      expect(headers[1].textContent).toContain('Valeur');
      expect(headers[2].textContent).toContain('Score');
    });

    it('should mark numeric columns with text-align right', async () => {
      await setup();
      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers[1].classList.contains('col--numeric')).toBe(true);
    });
  });

  // ─── Lignes de données ────────────────────────────────────────────────────────

  describe('lignes de données', () => {
    it('should render one row per data item', async () => {
      await setup();
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="table-row"]');
      expect(rows).toHaveLength(3);
    });

    it('should display data values in cells', async () => {
      await setup();
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="table-row"]');
      expect(rows[0].textContent).toContain('Danone');
      expect(rows[1].textContent).toContain('Arkéa');
    });
  });

  // ─── État vide ────────────────────────────────────────────────────────────────

  describe('état vide', () => {
    it('should display empty state when rows is empty', async () => {
      await setup([]);
      const empty = fixture.nativeElement.querySelector('[data-testid="table-empty"]');
      expect(empty).toBeTruthy();
    });

    it('should not display empty state when rows exist', async () => {
      await setup();
      const empty = fixture.nativeElement.querySelector('[data-testid="table-empty"]');
      expect(empty).toBeNull();
    });

    it('should not render table rows when empty', async () => {
      await setup([]);
      const rows = fixture.nativeElement.querySelectorAll('[data-testid="table-row"]');
      expect(rows).toHaveLength(0);
    });
  });

  // ─── État chargement ─────────────────────────────────────────────────────────

  describe('état loading', () => {
    it('should display loading indicator when loading is true', async () => {
      await setup([], true);
      const loader = fixture.nativeElement.querySelector('[data-testid="table-loading"]');
      expect(loader).toBeTruthy();
    });

    it('should not display empty state while loading', async () => {
      await setup([], true);
      const empty = fixture.nativeElement.querySelector('[data-testid="table-empty"]');
      expect(empty).toBeNull();
    });

    it('should not display loading indicator when loading is false', async () => {
      await setup();
      const loader = fixture.nativeElement.querySelector('[data-testid="table-loading"]');
      expect(loader).toBeNull();
    });
  });

  // ─── Tri ─────────────────────────────────────────────────────────────────────

  describe('tri', () => {
    it('should show sort button on sortable columns', async () => {
      await setup();
      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers[0].querySelector('[data-testid="sort-btn"]')).toBeTruthy();
      expect(headers[1].querySelector('[data-testid="sort-btn"]')).toBeTruthy();
    });

    it('should not show sort button on non-sortable columns', async () => {
      await setup();
      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers[2].querySelector('[data-testid="sort-btn"]')).toBeNull();
    });

    it('should emit sortChange event when clicking a sortable header', async () => {
      await setup();
      const sortSpy = vi.fn();
      component.sortChange.subscribe(sortSpy);

      const sortBtn = fixture.nativeElement.querySelector('[data-testid="sort-btn"]');
      sortBtn.click();
      fixture.detectChanges();

      expect(sortSpy).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
    });

    it('should toggle sort direction on second click', async () => {
      await setup();
      const sortSpy = vi.fn();
      component.sortChange.subscribe(sortSpy);

      const sortBtn = fixture.nativeElement.querySelector('[data-testid="sort-btn"]');
      sortBtn.click();
      sortBtn.click();
      fixture.detectChanges();

      expect(sortSpy).toHaveBeenLastCalledWith({ key: 'name', direction: 'desc' });
    });

    it('should mark the active sort column', async () => {
      await setup();
      const sortBtn = fixture.nativeElement.querySelector('[data-testid="sort-btn"]');
      sortBtn.click();
      fixture.detectChanges();

      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers[0].classList.contains('col--sorted')).toBe(true);
    });
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────────

  describe('accessibilité', () => {
    it('should have role="table" or be a <table> element', async () => {
      await setup();
      const table = fixture.nativeElement.querySelector('table');
      expect(table).toBeTruthy();
    });

    it('should have scope="col" on header cells', async () => {
      await setup();
      const headers = fixture.nativeElement.querySelectorAll('th');
      headers.forEach((th: HTMLElement) => {
        expect(th.getAttribute('scope')).toBe('col');
      });
    });

    it('should have aria-sort on sorted column header', async () => {
      await setup();
      const sortBtn = fixture.nativeElement.querySelector('[data-testid="sort-btn"]');
      sortBtn.click();
      fixture.detectChanges();

      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers[0].getAttribute('aria-sort')).toBe('ascending');
    });
  });
});
