import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { vi } from 'vitest';
import { CsvExportService } from './csv-export.service';

describe('CsvExportService', () => {
  let service: CsvExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvExportService);
  });

  // ─── generateCsv ─────────────────────────────────────────────────────────────

  describe('generateCsv', () => {
    it('should produce a header row followed by data rows', () => {
      const csv = service.generateCsv(
        ['Ticker', 'Nom'],
        [['BN', 'Danone'], ['CW8', 'Amundi World']]
      );
      const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
      expect(lines[0]).toBe('Ticker,Nom');
      expect(lines[1]).toBe('BN,Danone');
      expect(lines[2]).toBe('CW8,Amundi World');
    });

    it('should render null values as empty string', () => {
      const csv = service.generateCsv(['A', 'B'], [[null, 'foo']]);
      expect(csv).toContain(',foo');
    });

    it('should quote values that contain a comma', () => {
      const csv = service.generateCsv(['A'], [['Nom, avec virgule']]);
      expect(csv).toContain('"Nom, avec virgule"');
    });

    it('should escape double-quotes inside quoted values', () => {
      const csv = service.generateCsv(['A'], [['Il dit "bonjour"']]);
      expect(csv).toContain('"Il dit ""bonjour"""');
    });

    it('should quote values that contain a newline', () => {
      const csv = service.generateCsv(['A'], [['ligne1\nligne2']]);
      expect(csv).toContain('"ligne1\nligne2"');
    });

    it('should handle numeric values', () => {
      const csv = service.generateCsv(['Prix'], [[155.5]]);
      expect(csv).toContain('155.5');
    });

    it('should return only the header when rows is empty', () => {
      const csv = service.generateCsv(['A', 'B'], []);
      expect(csv.replace(/^\uFEFF/, '')).toBe('A,B');
    });

    it('should prepend a UTF-8 BOM for Excel compatibility', () => {
      const csv = service.generateCsv(['A'], [['v']]);
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
    });
  });

  // ─── download ────────────────────────────────────────────────────────────────

  describe('download', () => {
    it('should create an anchor element and trigger a click', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {},
      } as unknown as HTMLAnchorElement;

      const doc = TestBed.inject(DOCUMENT);
      vi.spyOn(doc, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      service.download('export.csv', ['Ticker'], [['BN']]);

      expect(mockAnchor.download).toBe('export.csv');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });
  });
});
