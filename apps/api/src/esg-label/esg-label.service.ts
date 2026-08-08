import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { EsgLabelType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const RELEVANT_LABELS: readonly string[] = ['ISR', 'GREENFIN', 'FINANSOL'];
const REQUIRED_COLUMNS = ['label', 'isin', 'date_arrete'];

export interface SyncResult {
  totalRows: number;
  matched: number;
  skippedLabels: number;
  unmatchedIsin: number;
}

@Injectable()
export class EsgLabelService {
  private readonly logger = new Logger(EsgLabelService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncFromUrl(url: string): Promise<SyncResult> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.data);
    const sheet = workbook.worksheets[0];

    // Résoudre les colonnes par en-tête plutôt que par position : le
    // référentiel peut réordonner ses colonnes d'un trimestre à l'autre.
    const columnIndex: Record<string, number> = {};
    sheet.getRow(1).eachCell((cell, colNumber) => {
      const key = String(cell.value ?? '').trim().toLowerCase();
      if (key) columnIndex[key] = colNumber;
    });

    for (const key of REQUIRED_COLUMNS) {
      if (!columnIndex[key]) {
        throw new BadRequestException(`Colonne "${key}" introuvable dans le fichier`);
      }
    }

    const assets = await this.prisma.asset.findMany({
      where: { isin: { not: null } },
      select: { id: true, isin: true },
    });
    const assetIdByIsin = new Map(assets.map((a) => [a.isin, a.id]));

    const result: SyncResult = { totalRows: 0, matched: 0, skippedLabels: 0, unmatchedIsin: 0 };

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const label = String(row.getCell(columnIndex['label']).value ?? '').trim().toUpperCase();
      const isinCell = String(row.getCell(columnIndex['isin']).value ?? '').trim();

      if (!label && !isinCell) continue; // ligne vide en fin de fichier
      result.totalRows++;

      if (!RELEVANT_LABELS.includes(label)) {
        result.skippedLabels++;
        continue;
      }

      // Certaines lignes listent plusieurs codes ISIN pour un même fonds
      // (plusieurs parts/classes), séparés par "," ou ";".
      const isinCandidates = isinCell.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      const assetId = isinCandidates.map((c) => assetIdByIsin.get(c)).find((id) => id !== undefined);
      if (!assetId) {
        result.unmatchedIsin++;
        continue;
      }

      const dateArreteValue = row.getCell(columnIndex['date_arrete']).value;
      const asOfDate = dateArreteValue instanceof Date ? dateArreteValue : new Date(String(dateArreteValue));

      await this.prisma.assetLabel.upsert({
        where: { assetId_label: { assetId, label: label as EsgLabelType } },
        create: { assetId, label: label as EsgLabelType, asOfDate, source: 'Banque de France' },
        update: { asOfDate, fetchedAt: new Date() },
      });
      result.matched++;
    }

    this.logger.log(
      `Sync labels ESG : ${result.matched} matchés, ${result.unmatchedIsin} ISIN non trouvés, ${result.skippedLabels} lignes hors périmètre (${result.totalRows} lignes au total)`
    );

    return result;
  }

  findAllByAsset(assetId: string) {
    return this.prisma.assetLabel.findMany({ where: { assetId } });
  }
}
