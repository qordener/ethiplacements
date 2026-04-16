import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type CsvValue = string | number | null | undefined;

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  private readonly document = inject(DOCUMENT);

  /**
   * Génère une chaîne CSV (avec BOM UTF-8 pour compatibilité Excel).
   */
  generateCsv(headers: string[], rows: CsvValue[][]): string {
    const escape = (v: CsvValue): string => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(',')),
    ];

    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Déclenche le téléchargement d'un fichier CSV dans le navigateur.
   */
  download(filename: string, headers: string[], rows: CsvValue[][]): void {
    const csv  = this.generateCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    const a      = this.document.createElement('a');
    a.href       = url;
    a.download   = filename;
    a.click();

    URL.revokeObjectURL(url);
  }
}
