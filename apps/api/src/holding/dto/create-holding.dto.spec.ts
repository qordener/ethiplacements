import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateHoldingDto } from './create-holding.dto';

describe('CreateHoldingDto', () => {
  // ─── Cas valides ──────────────────────────────────────────────────────────

  it('should be valid with assetId, quantity, and averagePrice', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 10, averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept decimal quantity (fractional shares)', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 0.5, averagePrice: 150 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  // ─── Champ assetId ────────────────────────────────────────────────────────

  it('should fail when assetId is missing', async () => {
    const dto = plainToInstance(CreateHoldingDto, { quantity: 10, averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'assetId')).toBe(true);
  });

  it('should fail when assetId is empty string', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: '', quantity: 10, averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'assetId')).toBe(true);
  });

  // ─── Champ quantity ───────────────────────────────────────────────────────

  it('should fail when quantity is missing', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('should fail when quantity is 0', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 0, averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('should fail when quantity is negative', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: -5, averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('should fail when quantity is not a number', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 'ten', averagePrice: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  // ─── Champ averagePrice ───────────────────────────────────────────────────

  it('should fail when averagePrice is missing', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 10 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'averagePrice')).toBe(true);
  });

  it('should fail when averagePrice is 0', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 10, averagePrice: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'averagePrice')).toBe(true);
  });

  it('should fail when averagePrice is negative', async () => {
    const dto = plainToInstance(CreateHoldingDto, { assetId: 'asset1', quantity: 10, averagePrice: -10 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'averagePrice')).toBe(true);
  });
});
