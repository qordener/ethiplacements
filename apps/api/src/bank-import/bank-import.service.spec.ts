import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { BankImportService } from './bank-import.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionService } from '../transaction/transaction.service';

function ofxWith(opts: {
  buy?: boolean;
  sell?: boolean;
  income?: boolean;
  deposit?: boolean;
  withdrawal?: boolean;
  unknownSecurity?: boolean;
}): string {
  const buy = opts.buy ? `
    <BUYSTOCK>
      <INVBUY>
        <INVTRAN><FITID>B1</FITID><DTTRADE>20260115</DTTRADE></INVTRAN>
        <SECID><UNIQUEID>${opts.unknownSecurity ? 'FR9999999999' : 'FR0010315770'}</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
        <UNITS>10</UNITS><UNITPRICE>350.00</UNITPRICE><TOTAL>-3500.00</TOTAL>
      </INVBUY>
      <BUYTYPE>BUY</BUYTYPE>
    </BUYSTOCK>` : '';
  const sell = opts.sell ? `
    <SELLSTOCK>
      <INVSELL>
        <INVTRAN><FITID>S1</FITID><DTTRADE>20260220</DTTRADE></INVTRAN>
        <SECID><UNIQUEID>FR0010315770</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
        <UNITS>-5</UNITS><UNITPRICE>360.00</UNITPRICE><TOTAL>1800.00</TOTAL>
      </INVSELL>
      <SELLTYPE>SELL</SELLTYPE>
    </SELLSTOCK>` : '';
  const income = opts.income ? `
    <INCOME>
      <INVTRAN><FITID>D1</FITID><DTTRADE>20260301</DTTRADE></INVTRAN>
      <SECID><UNIQUEID>FR0010315770</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
      <INCOMETYPE>DIV</INCOMETYPE><TOTAL>25.00</TOTAL>
    </INCOME>` : '';
  const deposit = opts.deposit ? `
    <INVBANKTRAN>
      <STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20260110</DTPOSTED><TRNAMT>1000.00</TRNAMT><FITID>C1</FITID><NAME>Versement</NAME></STMTTRN>
      <SUBACCTFUND>CASH</SUBACCTFUND>
    </INVBANKTRAN>` : '';
  const withdrawal = opts.withdrawal ? `
    <INVBANKTRAN>
      <STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260112</DTPOSTED><TRNAMT>-200.00</TRNAMT><FITID>C2</FITID><NAME>Retrait</NAME></STMTTRN>
      <SUBACCTFUND>CASH</SUBACCTFUND>
    </INVBANKTRAN>` : '';

  return `<?xml version="1.0"?><?OFX OFXHEADER="200"?><OFX>
    <INVSTMTMSGSRSV1><INVSTMTTRNRS><INVSTMTRS>
      <INVACCTFROM><ACCTID>1</ACCTID></INVACCTFROM>
      <INVTRANLIST>${buy}${sell}${income}${deposit}${withdrawal}</INVTRANLIST>
    </INVSTMTRS></INVSTMTTRNRS></INVSTMTMSGSRSV1>
    <SECLISTMSGSRSV1><SECLIST>
      <STOCKINFO><SECINFO><SECID><UNIQUEID>FR0010315770</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID><SECNAME>Amundi MSCI World SRI</SECNAME><TICKER>CW8</TICKER></SECINFO></STOCKINFO>
    </SECLIST></SECLISTMSGSRSV1>
  </OFX>`;
}

const mockPrisma = {
  portfolio: { findUnique: vi.fn() },
  holding: { findMany: vi.fn() },
  deposit: { create: vi.fn() },
};

const mockTransactionService = { create: vi.fn() };

describe('BankImportService', () => {
  let service: BankImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankImportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    service = module.get<BankImportService>(BankImportService);
    vi.clearAllMocks();
    mockPrisma.portfolio.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.holding.findMany.mockResolvedValue([
      { id: 'h1', portfolioId: 'p1', assetId: 'a1', quantity: 20, averagePrice: 300, asset: { id: 'a1', ticker: 'CW8', isin: 'FR0010315770' } },
    ]);
  });

  it('should throw NotFoundException when the portfolio does not exist', async () => {
    mockPrisma.portfolio.findUnique.mockResolvedValue(null);

    await expect(service.importOfx('nonexistent', ofxWith({ buy: true }), false)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when the file is not valid OFX', async () => {
    await expect(service.importOfx('p1', 'not ofx', false)).rejects.toThrow(BadRequestException);
  });

  describe('preview mode (confirm=false)', () => {
    it('should resolve a BUY transaction to the matching holding without writing anything', async () => {
      const result = await service.importOfx('p1', ofxWith({ buy: true }), false);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toMatchObject({ kind: 'BUY', holdingId: 'h1', imported: false, skippedReason: null });
      expect(mockTransactionService.create).not.toHaveBeenCalled();
    });

    it('should flag a transaction referencing an unknown security', async () => {
      const result = await service.importOfx('p1', ofxWith({ buy: true, unknownSecurity: true }), false);

      expect(result.transactions[0].holdingId).toBeNull();
      expect(result.transactions[0].skippedReason).toMatch(/non reconnu/);
    });

    it('should compute a dividend quantity/price from the currently held quantity', async () => {
      const result = await service.importOfx('p1', ofxWith({ income: true }), false);

      expect(result.transactions[0]).toMatchObject({ kind: 'DIVIDEND', quantity: 20, price: 1.25, amount: 25 });
    });

    it('should flag a dividend as unresolvable when the holding quantity is zero', async () => {
      mockPrisma.holding.findMany.mockResolvedValue([
        { id: 'h1', portfolioId: 'p1', assetId: 'a1', quantity: 0, averagePrice: 300, asset: { id: 'a1', ticker: 'CW8', isin: 'FR0010315770' } },
      ]);

      const result = await service.importOfx('p1', ofxWith({ income: true }), false);

      expect(result.transactions[0].skippedReason).toMatch(/Aucune position/);
    });

    it('should only include positive cash movements as deposits, not withdrawals', async () => {
      const result = await service.importOfx('p1', ofxWith({ deposit: true, withdrawal: true }), false);

      expect(result.deposits).toHaveLength(1);
      expect(result.deposits[0].amount).toBe(1000);
    });
  });

  describe('confirm mode', () => {
    it('should create a BUY transaction via TransactionService and mark it imported', async () => {
      mockTransactionService.create.mockResolvedValue({ id: 't1' });

      const result = await service.importOfx('p1', ofxWith({ buy: true }), true);

      expect(mockTransactionService.create).toHaveBeenCalledWith('h1', {
        type: 'BUY', quantity: 10, price: 350, date: '2026-01-15',
      });
      expect(result.transactions[0].imported).toBe(true);
    });

    it('should not create a transaction for an unresolved security even in confirm mode', async () => {
      const result = await service.importOfx('p1', ofxWith({ buy: true, unknownSecurity: true }), true);

      expect(mockTransactionService.create).not.toHaveBeenCalled();
      expect(result.transactions[0].imported).toBe(false);
    });

    it('should mark a row as failed (not abort others) when the underlying create rejects', async () => {
      mockTransactionService.create.mockRejectedValue(new UnprocessableEntityException('Quantité vendue supérieure à la position détenue'));

      const result = await service.importOfx('p1', ofxWith({ sell: true }), true);

      expect(result.transactions[0].imported).toBe(false);
      expect(result.transactions[0].error).toMatch(/supérieure/);
    });

    it('should create deposits via PrismaService for positive cash movements', async () => {
      mockPrisma.deposit.create.mockResolvedValue({ id: 'd1' });

      const result = await service.importOfx('p1', ofxWith({ deposit: true }), true);

      expect(mockPrisma.deposit.create).toHaveBeenCalledWith({
        data: { portfolioId: 'p1', amount: 1000, date: new Date('2026-01-10'), notes: 'Versement' },
      });
      expect(result.deposits[0].imported).toBe(true);
    });

    it('should import BUY and SELL in chronological order regardless of file order', async () => {
      mockTransactionService.create.mockResolvedValue({ id: 't1' });

      await service.importOfx('p1', ofxWith({ buy: true, sell: true }), true);

      const calls = mockTransactionService.create.mock.calls;
      expect(calls[0][1].type).toBe('BUY'); // 2026-01-15
      expect(calls[1][1].type).toBe('SELL'); // 2026-02-20
    });
  });
});
