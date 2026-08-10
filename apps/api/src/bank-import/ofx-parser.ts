import { XMLParser } from 'fast-xml-parser';

export interface OfxSecurity {
  uniqueId: string;
  uniqueIdType: string;
  ticker: string | null;
  name: string;
}

export interface OfxInvestmentTransaction {
  fitId: string;
  type: 'BUY' | 'SELL';
  tradeDate: string; // YYYY-MM-DD
  units: number; // toujours positif, y compris pour une vente
  unitPrice: number;
  total: number;
  securityUniqueId: string;
}

export interface OfxIncomeTransaction {
  fitId: string;
  date: string; // YYYY-MM-DD
  total: number;
  securityUniqueId: string;
  incomeType: string;
}

export interface OfxCashTransaction {
  fitId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  name: string;
}

export interface ParsedOfxStatement {
  securities: OfxSecurity[];
  transactions: OfxInvestmentTransaction[];
  income: OfxIncomeTransaction[];
  cashTransactions: OfxCashTransaction[];
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseOfxDate(raw: unknown): string {
  // Dates OFX : YYYYMMDD[HHMMSS[.XXX[gmt tz]]] — on ne garde que la date.
  const digits = String(raw ?? '').slice(0, 8);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/**
 * OFX 2.x fait précéder le document XML d'un prologue et d'une directive de
 * traitement `<?OFX ...?>` non standard que les parseurs XML génériques
 * rejettent. On isole le contenu à partir de la première balise `<OFX>`.
 */
function stripOfxProlog(raw: string): string {
  const idx = raw.indexOf('<OFX>');
  if (idx === -1) {
    throw new Error("Balise <OFX> introuvable — ce fichier n'est pas un relevé OFX 2.x (XML) valide");
  }
  return raw.slice(idx);
}

export function parseOfxInvestmentStatement(raw: string): ParsedOfxStatement {
  const xml = stripOfxProlog(raw);
  const parser = new XMLParser();
  const doc = parser.parse(xml);

  const invStmtRs = doc?.OFX?.INVSTMTMSGSRSV1?.INVSTMTTRNRS?.INVSTMTRS;
  if (!invStmtRs) {
    throw new Error('Aucun relevé de compte-titres (INVSTMTRS) trouvé dans ce fichier');
  }

  const tranList = invStmtRs.INVTRANLIST ?? {};
  const secList = doc?.OFX?.SECLISTMSGSRSV1?.SECLIST ?? {};

  const securities: OfxSecurity[] = [...toArray(secList.STOCKINFO), ...toArray(secList.MFINFO)].map((info) => ({
    uniqueId: String(info?.SECINFO?.SECID?.UNIQUEID ?? ''),
    uniqueIdType: String(info?.SECINFO?.SECID?.UNIQUEIDTYPE ?? ''),
    ticker: info?.SECINFO?.TICKER ? String(info.SECINFO.TICKER) : null,
    name: String(info?.SECINFO?.SECNAME ?? ''),
  }));

  const buys: OfxInvestmentTransaction[] = toArray(tranList.BUYSTOCK).map((t) => ({
    fitId: String(t.INVBUY.INVTRAN.FITID),
    type: 'BUY' as const,
    tradeDate: parseOfxDate(t.INVBUY.INVTRAN.DTTRADE),
    units: Math.abs(Number(t.INVBUY.UNITS)),
    unitPrice: Number(t.INVBUY.UNITPRICE),
    total: Number(t.INVBUY.TOTAL),
    securityUniqueId: String(t.INVBUY.SECID.UNIQUEID),
  }));

  const sells: OfxInvestmentTransaction[] = toArray(tranList.SELLSTOCK).map((t) => ({
    fitId: String(t.INVSELL.INVTRAN.FITID),
    type: 'SELL' as const,
    tradeDate: parseOfxDate(t.INVSELL.INVTRAN.DTTRADE),
    units: Math.abs(Number(t.INVSELL.UNITS)),
    unitPrice: Number(t.INVSELL.UNITPRICE),
    total: Number(t.INVSELL.TOTAL),
    securityUniqueId: String(t.INVSELL.SECID.UNIQUEID),
  }));

  const income: OfxIncomeTransaction[] = toArray(tranList.INCOME).map((t) => ({
    fitId: String(t.INVTRAN.FITID),
    date: parseOfxDate(t.INVTRAN.DTTRADE),
    total: Number(t.TOTAL),
    securityUniqueId: String(t.SECID.UNIQUEID),
    incomeType: String(t.INCOMETYPE ?? ''),
  }));

  const cashTransactions: OfxCashTransaction[] = toArray(tranList.INVBANKTRAN)
    .map((t) => t.STMTTRN)
    .filter(Boolean)
    .map((t) => ({
      fitId: String(t.FITID),
      date: parseOfxDate(t.DTPOSTED),
      amount: Number(t.TRNAMT),
      name: String(t.NAME ?? t.MEMO ?? ''),
    }));

  return { securities, transactions: [...buys, ...sells], income, cashTransactions };
}
