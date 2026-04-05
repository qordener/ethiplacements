import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAssetDto } from './create-asset.dto';

describe('CreateAssetDto', () => {
  // ─── Cas valides ──────────────────────────────────────────────────────────

  it('should be valid with required fields only (name, ticker, type)', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', ticker: 'BTC', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with all fields', async () => {
    const dto = plainToInstance(CreateAssetDto, {
      name: 'Amundi MSCI World SRI',
      ticker: 'CW8',
      isin: 'LU1861134382',
      type: 'ETF',
      sector: 'Global',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept all valid AssetType values', async () => {
    const types = ['STOCK', 'ETF', 'BOND', 'CRYPTO', 'OTHER'];
    for (const type of types) {
      const dto = plainToInstance(CreateAssetDto, { name: 'Test', ticker: 'TST', type });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'type')).toBe(false);
    }
  });

  // ─── Champ name ───────────────────────────────────────────────────────────

  it('should fail when name is missing', async () => {
    const dto = plainToInstance(CreateAssetDto, { ticker: 'BTC', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when name is empty string', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: '', ticker: 'BTC', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when name is not a string', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 42, ticker: 'BTC', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  // ─── Champ ticker ─────────────────────────────────────────────────────────

  it('should fail when ticker is missing', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'ticker')).toBe(true);
  });

  it('should fail when ticker is empty string', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', ticker: '', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'ticker')).toBe(true);
  });

  // ─── Champ type ───────────────────────────────────────────────────────────

  it('should fail when type is missing', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', ticker: 'BTC' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('should fail when type is not a valid AssetType', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', ticker: 'BTC', type: 'INVALID' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  // ─── Champs optionnels ────────────────────────────────────────────────────

  it('should accept undefined isin (optional)', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', ticker: 'BTC', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'isin')).toBe(false);
  });

  it('should fail when isin is provided but not a string', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Test', ticker: 'TST', type: 'ETF', isin: 123 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'isin')).toBe(true);
  });

  it('should accept undefined sector (optional)', async () => {
    const dto = plainToInstance(CreateAssetDto, { name: 'Bitcoin', ticker: 'BTC', type: 'CRYPTO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'sector')).toBe(false);
  });
});
