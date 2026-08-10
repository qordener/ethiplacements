import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionService } from '../transaction/transaction.service';
import { parseOfxInvestmentStatement, OfxSecurity, ParsedOfxStatement } from './ofx-parser';

export interface PreviewTransactionRow {
  fitId: string;
  kind: 'BUY' | 'SELL' | 'DIVIDEND';
  date: string;
  quantity: number | null;
  price: number | null;
  amount: number;
  securityName: string;
  securityTicker: string | null;
  holdingId: string | null;
  skippedReason: string | null;
}

export interface PreviewDepositRow {
  fitId: string;
  date: string;
  amount: number;
  label: string;
}

export interface ImportedTransactionRow extends PreviewTransactionRow {
  imported: boolean;
  error: string | null;
}

export interface ImportedDepositRow extends PreviewDepositRow {
  imported: boolean;
  error: string | null;
}

export interface BankImportResult {
  transactions: ImportedTransactionRow[];
  deposits: ImportedDepositRow[];
}

@Injectable()
export class BankImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  async importOfx(portfolioId: string, fileContent: string, confirm: boolean): Promise<BankImportResult> {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException(`Portfolio ${portfolioId} introuvable`);

    let parsed: ParsedOfxStatement;
    try {
      parsed = parseOfxInvestmentStatement(fileContent);
    } catch (e: unknown) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Fichier OFX invalide');
    }

    const holdings = await this.prisma.holding.findMany({
      where: { portfolioId },
      include: { asset: true },
    });
    const holdingByIsin = new Map(holdings.filter((h) => h.asset.isin).map((h) => [h.asset.isin as string, h]));
    const holdingByTicker = new Map(holdings.map((h) => [h.asset.ticker.toUpperCase(), h]));
    const securityById = new Map(parsed.securities.map((s) => [s.uniqueId, s]));

    const resolveHolding = (securityUniqueId: string) => {
      const sec = securityById.get(securityUniqueId);
      if (!sec) return null;
      if (sec.uniqueIdType.toUpperCase() === 'ISIN' && holdingByIsin.has(sec.uniqueId)) {
        return holdingByIsin.get(sec.uniqueId) ?? null;
      }
      if (sec.ticker && holdingByTicker.has(sec.ticker.toUpperCase())) {
        return holdingByTicker.get(sec.ticker.toUpperCase()) ?? null;
      }
      return null;
    };

    const securityLabel = (securityUniqueId: string, sec: OfxSecurity | undefined) => ({
      securityName: sec?.name || securityUniqueId,
      securityTicker: sec?.ticker ?? null,
    });

    const transactionRows: PreviewTransactionRow[] = [];

    for (const t of parsed.transactions) {
      const holding = resolveHolding(t.securityUniqueId);
      const sec = securityById.get(t.securityUniqueId);
      transactionRows.push({
        fitId: t.fitId,
        kind: t.type,
        date: t.tradeDate,
        quantity: t.units,
        price: t.unitPrice,
        amount: t.total,
        ...securityLabel(t.securityUniqueId, sec),
        holdingId: holding?.id ?? null,
        skippedReason: holding ? null : 'Actif non reconnu dans ce portefeuille (ISIN/ticker non matché)',
      });
    }

    for (const t of parsed.income) {
      const holding = resolveHolding(t.securityUniqueId);
      const sec = securityById.get(t.securityUniqueId);
      let quantity: number | null = null;
      let price: number | null = null;
      let skippedReason: string | null = null;

      if (!holding) {
        skippedReason = 'Actif non reconnu dans ce portefeuille (ISIN/ticker non matché)';
      } else if (holding.quantity <= 0) {
        skippedReason = 'Aucune position détenue actuellement pour répartir ce dividende';
      } else {
        // L'agrégat OFX INCOME ne fournit qu'un montant total, pas de
        // quantité par action — on la déduit de la position actuellement
        // détenue (meilleure donnée disponible) plutôt que d'inventer une
        // valeur. Le montant total importé reste exact dans tous les cas.
        quantity = holding.quantity;
        price = t.total / holding.quantity;
      }

      transactionRows.push({
        fitId: t.fitId,
        kind: 'DIVIDEND',
        date: t.date,
        quantity,
        price,
        amount: t.total,
        ...securityLabel(t.securityUniqueId, sec),
        holdingId: holding?.id ?? null,
        skippedReason,
      });
    }

    const depositRows: PreviewDepositRow[] = parsed.cashTransactions
      .filter((c) => c.amount > 0)
      .map((c) => ({ fitId: c.fitId, date: c.date, amount: c.amount, label: c.name }));

    const importedTransactions: ImportedTransactionRow[] = [];
    // Ordre chronologique : un SELL importé avant son BUY correspondant
    // échouerait la validation de quantité disponible.
    const sortedRows = [...transactionRows].sort((a, b) => a.date.localeCompare(b.date));

    for (const row of sortedRows) {
      if (!confirm || !row.holdingId || row.skippedReason) {
        importedTransactions.push({ ...row, imported: false, error: null });
        continue;
      }
      try {
        await this.transactionService.create(row.holdingId, {
          type: row.kind,
          quantity: row.quantity as number,
          price: row.price as number,
          date: row.date,
        });
        importedTransactions.push({ ...row, imported: true, error: null });
      } catch (e: unknown) {
        importedTransactions.push({
          ...row,
          imported: false,
          error: e instanceof Error ? e.message : "Échec de l'import",
        });
      }
    }
    // Restaure l'ordre d'origine (BUY/SELL puis DIVIDEND) pour l'affichage.
    const importedByFitId = new Map(importedTransactions.map((r) => [r.fitId, r]));
    const orderedTransactions = transactionRows.map((r) => importedByFitId.get(r.fitId) as ImportedTransactionRow);

    const importedDeposits: ImportedDepositRow[] = [];
    for (const row of depositRows) {
      if (!confirm) {
        importedDeposits.push({ ...row, imported: false, error: null });
        continue;
      }
      try {
        await this.prisma.deposit.create({
          data: { portfolioId, amount: row.amount, date: new Date(row.date), notes: row.label },
        });
        importedDeposits.push({ ...row, imported: true, error: null });
      } catch (e: unknown) {
        importedDeposits.push({ ...row, imported: false, error: e instanceof Error ? e.message : "Échec de l'import" });
      }
    }

    return { transactions: orderedTransactions, deposits: importedDeposits };
  }
}
