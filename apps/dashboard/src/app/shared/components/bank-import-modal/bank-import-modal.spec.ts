import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BankImportModal } from './bank-import-modal';
import { BankImportService } from '../../../features/portfolio/bank-import.service';

describe('BankImportModal', () => {
  let fixture: ComponentFixture<BankImportModal>;
  let component: BankImportModal;
  let mockBankImportService: { importOfx: ReturnType<typeof vi.fn> };

  function fakeFileInputEvent(file: File): Event {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    return { target: input } as unknown as Event;
  }

  beforeEach(async () => {
    mockBankImportService = { importOfx: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BankImportModal],
      providers: [{ provide: BankImportService, useValue: mockBankImportService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BankImportModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('portfolioId', 'p1');
    fixture.detectChanges();
  });

  it('should not render the modal dialog until open() is called', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="modal-dialog"]')).toBeNull();
  });

  it('should render the modal dialog after open()', () => {
    component.open();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="modal-dialog"]')).toBeTruthy();
  });

  it('should trigger a preview (confirm=false) as soon as a file is selected', () => {
    mockBankImportService.importOfx.mockReturnValue(of({ transactions: [], deposits: [] }));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');

    component.open();
    component.onFileSelected(fakeFileInputEvent(file));

    expect(mockBankImportService.importOfx).toHaveBeenCalledWith('p1', file, false);
  });

  it('should display the preview rows returned by the service', () => {
    mockBankImportService.importOfx.mockReturnValue(of({
      transactions: [{ fitId: 'B1', kind: 'BUY', date: '2026-01-15', quantity: 10, price: 350, amount: -3500, securityName: 'Amundi MSCI World SRI', securityTicker: 'CW8', holdingId: 'holding-1', skippedReason: null, imported: false, error: null }],
      deposits: [],
    }));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');

    component.open();
    component.onFileSelected(fakeFileInputEvent(file));
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('[data-testid="bank-import-transaction-row"]');
    expect(row.textContent).toContain('CW8');
    expect(row.textContent).toContain('BUY');
  });

  it('should show the confirm button only when at least one row is ready to import', () => {
    mockBankImportService.importOfx.mockReturnValue(of({
      transactions: [{ fitId: 'B1', kind: 'BUY', date: '2026-01-15', quantity: 10, price: 350, amount: -3500, securityName: 'CW8', securityTicker: 'CW8', holdingId: 'holding-1', skippedReason: null, imported: false, error: null }],
      deposits: [],
    }));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');

    component.open();
    component.onFileSelected(fakeFileInputEvent(file));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="bank-import-confirm-btn"]')).toBeTruthy();
  });

  it('should not show the confirm button when every row is unresolved', () => {
    mockBankImportService.importOfx.mockReturnValue(of({
      transactions: [{ fitId: 'B1', kind: 'BUY', date: '2026-01-15', quantity: 10, price: 350, amount: -3500, securityName: 'Unknown', securityTicker: null, holdingId: null, skippedReason: 'Actif non reconnu', imported: false, error: null }],
      deposits: [],
    }));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');

    component.open();
    component.onFileSelected(fakeFileInputEvent(file));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="bank-import-confirm-btn"]')).toBeNull();
  });

  it('should call importOfx with confirm=true and emit "imported" on confirmation', () => {
    const importedSpy = vi.fn();
    component.imported.subscribe(importedSpy);
    mockBankImportService.importOfx
      .mockReturnValueOnce(of({
        transactions: [{ fitId: 'B1', kind: 'BUY', date: '2026-01-15', quantity: 10, price: 350, amount: -3500, securityName: 'CW8', securityTicker: 'CW8', holdingId: 'holding-1', skippedReason: null, imported: false, error: null }],
        deposits: [],
      }))
      .mockReturnValueOnce(of({
        transactions: [{ fitId: 'B1', kind: 'BUY', date: '2026-01-15', quantity: 10, price: 350, amount: -3500, securityName: 'CW8', securityTicker: 'CW8', holdingId: 'holding-1', skippedReason: null, imported: true, error: null }],
        deposits: [],
      }));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');

    component.open();
    component.onFileSelected(fakeFileInputEvent(file));
    component.confirmImport();

    expect(mockBankImportService.importOfx).toHaveBeenLastCalledWith('p1', file, true);
    expect(importedSpy).toHaveBeenCalled();
    expect(component.confirmed()).toBe(true);
  });

  it('should display an error message when the preview request fails', () => {
    mockBankImportService.importOfx.mockReturnValue(throwError(() => ({ error: { message: 'Fichier invalide' } })));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');

    component.open();
    component.onFileSelected(fakeFileInputEvent(file));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="bank-import-error"]').textContent).toContain('Fichier invalide');
  });

  it('should reset state when reopened', () => {
    mockBankImportService.importOfx.mockReturnValue(of({ transactions: [], deposits: [] }));
    const file = new File(['<OFX></OFX>'], 'releve.ofx');
    component.open();
    component.onFileSelected(fakeFileInputEvent(file));

    component.close();
    component.open();

    expect(component.result()).toBeNull();
    expect(component.confirmed()).toBe(false);
  });
});
