import { describe, it, expect } from 'vitest';
import { parseOfxInvestmentStatement } from './ofx-parser';

// Structure vérifiée contre un fixture réel utilisé par la librairie Python
// ofxtools pour ses propres tests (github.com/csingley/ofxtools, tests/data/
// invstmtrs.ofx) — BUYSTOCK et SECLIST reproduisent fidèlement ce fixture.
// SELLSTOCK et INCOME suivent le même schéma (INVTRAN/SECID imbriqués),
// documenté par la spec OFX mais non présent dans ce fixture précis — à
// revalider dès qu'un export réel d'un courtier français sera disponible.
const SAMPLE_OFX = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<?OFX OFXHEADER="200" VERSION="200" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
      <DTSERVER>20260601101003</DTSERVER>
      <LANGUAGE>FRE</LANGUAGE>
    </SONRS>
  </SIGNONMSGSRSV1>
  <INVSTMTMSGSRSV1>
    <INVSTMTTRNRS>
      <TRNUID>1001</TRNUID>
      <STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
      <INVSTMTRS>
        <DTASOF>20260601010000</DTASOF>
        <CURDEF>EUR</CURDEF>
        <INVACCTFROM><BROKERID>121099999</BROKERID><ACCTID>999988</ACCTID></INVACCTFROM>
        <INVTRANLIST>
          <DTSTART>20260101130105</DTSTART>
          <DTEND>20260601101000</DTEND>
          <BUYSTOCK>
            <INVBUY>
              <INVTRAN><FITID>23321</FITID><DTTRADE>20260115</DTTRADE><DTSETTLE>20260118</DTSETTLE></INVTRAN>
              <SECID><UNIQUEID>FR0010315770</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
              <UNITS>10</UNITS>
              <UNITPRICE>350.00</UNITPRICE>
              <COMMISSION>5.00</COMMISSION>
              <TOTAL>-3505.00</TOTAL>
              <SUBACCTSEC>CASH</SUBACCTSEC>
              <SUBACCTFUND>CASH</SUBACCTFUND>
            </INVBUY>
            <BUYTYPE>BUY</BUYTYPE>
          </BUYSTOCK>
          <SELLSTOCK>
            <INVSELL>
              <INVTRAN><FITID>23322</FITID><DTTRADE>20260220</DTTRADE><DTSETTLE>20260223</DTSETTLE></INVTRAN>
              <SECID><UNIQUEID>FR0000121014</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
              <UNITS>-5</UNITS>
              <UNITPRICE>620.00</UNITPRICE>
              <COMMISSION>4.00</COMMISSION>
              <TOTAL>3096.00</TOTAL>
              <SUBACCTSEC>CASH</SUBACCTSEC>
              <SUBACCTFUND>CASH</SUBACCTFUND>
            </INVSELL>
            <SELLTYPE>SELL</SELLTYPE>
          </SELLSTOCK>
          <INCOME>
            <INVTRAN><FITID>23323</FITID><DTTRADE>20260301</DTTRADE></INVTRAN>
            <SECID><UNIQUEID>FR0000121014</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
            <INCOMETYPE>DIV</INCOMETYPE>
            <TOTAL>42.50</TOTAL>
            <SUBACCTSEC>CASH</SUBACCTSEC>
            <SUBACCTFUND>CASH</SUBACCTFUND>
          </INCOME>
          <INVBANKTRAN>
            <STMTTRN>
              <TRNTYPE>CREDIT</TRNTYPE>
              <DTPOSTED>20260110</DTPOSTED>
              <TRNAMT>2000.00</TRNAMT>
              <FITID>12345</FITID>
              <NAME>Versement</NAME>
              <MEMO>Virement depuis compte courant</MEMO>
            </STMTTRN>
            <SUBACCTFUND>CASH</SUBACCTFUND>
          </INVBANKTRAN>
        </INVTRANLIST>
      </INVSTMTRS>
    </INVSTMTTRNRS>
  </INVSTMTMSGSRSV1>
  <SECLISTMSGSRSV1>
    <SECLIST>
      <STOCKINFO>
        <SECINFO>
          <SECID><UNIQUEID>FR0010315770</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
          <SECNAME>Amundi MSCI World SRI</SECNAME>
          <TICKER>CW8</TICKER>
        </SECINFO>
      </STOCKINFO>
      <STOCKINFO>
        <SECINFO>
          <SECID><UNIQUEID>FR0000121014</UNIQUEID><UNIQUEIDTYPE>ISIN</UNIQUEIDTYPE></SECID>
          <SECNAME>LVMH</SECNAME>
          <TICKER>MC</TICKER>
        </SECINFO>
      </STOCKINFO>
    </SECLIST>
  </SECLISTMSGSRSV1>
</OFX>`;

describe('parseOfxInvestmentStatement', () => {
  it('should parse the securities list', () => {
    const result = parseOfxInvestmentStatement(SAMPLE_OFX);

    expect(result.securities).toHaveLength(2);
    expect(result.securities[0]).toEqual({
      uniqueId: 'FR0010315770',
      uniqueIdType: 'ISIN',
      ticker: 'CW8',
      name: 'Amundi MSCI World SRI',
    });
  });

  it('should parse a BUYSTOCK transaction', () => {
    const result = parseOfxInvestmentStatement(SAMPLE_OFX);
    const buy = result.transactions.find((t) => t.type === 'BUY');

    expect(buy).toEqual({
      fitId: '23321',
      type: 'BUY',
      tradeDate: '2026-01-15',
      units: 10,
      unitPrice: 350,
      total: -3505,
      securityUniqueId: 'FR0010315770',
    });
  });

  it('should parse a SELLSTOCK transaction with a positive unit count', () => {
    const result = parseOfxInvestmentStatement(SAMPLE_OFX);
    const sell = result.transactions.find((t) => t.type === 'SELL');

    expect(sell?.units).toBe(5); // valeur absolue, pas -5
    expect(sell?.total).toBe(3096);
    expect(sell?.securityUniqueId).toBe('FR0000121014');
  });

  it('should parse an INCOME (dividend) transaction', () => {
    const result = parseOfxInvestmentStatement(SAMPLE_OFX);

    expect(result.income).toEqual([{
      fitId: '23323',
      date: '2026-03-01',
      total: 42.5,
      securityUniqueId: 'FR0000121014',
      incomeType: 'DIV',
    }]);
  });

  it('should parse a cash deposit (INVBANKTRAN)', () => {
    const result = parseOfxInvestmentStatement(SAMPLE_OFX);

    expect(result.cashTransactions).toEqual([{
      fitId: '12345',
      date: '2026-01-10',
      amount: 2000,
      name: 'Versement',
    }]);
  });

  it('should throw a clear error when the file has no <OFX> tag', () => {
    expect(() => parseOfxInvestmentStatement('not an ofx file')).toThrow(/OFX/);
  });

  it('should throw a clear error when there is no investment statement', () => {
    const noInvStmt = '<OFX><SIGNONMSGSRSV1><SONRS><STATUS><CODE>0</CODE></STATUS></SONRS></SIGNONMSGSRSV1></OFX>';
    expect(() => parseOfxInvestmentStatement(noInvStmt)).toThrow(/relevé de compte-titres/);
  });

  it('should handle a single BUYSTOCK without an array wrapper', () => {
    // fast-xml-parser ne renvoie un tableau que si la balise apparaît plusieurs fois
    const singleBuyOnly = SAMPLE_OFX
      .replace(/<SELLSTOCK>[\s\S]*?<\/SELLSTOCK>/, '')
      .replace(/<INCOME>[\s\S]*?<\/INCOME>/, '');
    const result = parseOfxInvestmentStatement(singleBuyOnly);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('BUY');
  });
});
