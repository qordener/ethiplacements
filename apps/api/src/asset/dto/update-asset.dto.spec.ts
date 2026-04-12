import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateAssetDto } from './update-asset.dto';

describe('UpdateAssetDto', () => {
  it('should be valid with no fields (all optional)', async () => {
    const dto = plainToInstance(UpdateAssetDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  // ─── manualPrice ──────────────────────────────────────────────────────────

  it('should accept a valid manualPrice', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPrice: 150.5 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPrice')).toBe(false);
  });

  it('should accept manualPrice of 0 (free asset)', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPrice: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPrice')).toBe(false);
  });

  it('should fail when manualPrice is negative', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPrice: -1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPrice')).toBe(true);
  });

  it('should fail when manualPrice is not a number', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPrice: 'abc' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPrice')).toBe(true);
  });

  // ─── manualPriceDate ──────────────────────────────────────────────────────

  it('should accept a valid ISO date string for manualPriceDate', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPriceDate: '2026-04-12T00:00:00.000Z' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPriceDate')).toBe(false);
  });

  it('should accept a date-only string for manualPriceDate', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPriceDate: '2026-04-12' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPriceDate')).toBe(false);
  });

  it('should fail when manualPriceDate is not a valid date string', async () => {
    const dto = plainToInstance(UpdateAssetDto, { manualPriceDate: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'manualPriceDate')).toBe(true);
  });

  // ─── Combinaison prix + date ──────────────────────────────────────────────

  it('should accept manualPrice and manualPriceDate together', async () => {
    const dto = plainToInstance(UpdateAssetDto, {
      manualPrice: 155.5,
      manualPriceDate: '2026-04-12',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
