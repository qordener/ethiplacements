import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEsgScoreDto } from './create-esg-score.dto';

describe('CreateEsgScoreDto', () => {
  // ─── Cas valides ──────────────────────────────────────────────────────────

  it('should be valid with required fields only (score, provider)', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72, provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with all fields including details', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, {
      score: 65,
      provider: 'Sustainalytics',
      details: '{"E":70,"S":60,"G":65}',
      date: new Date().toISOString(),
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept score of 0 (minimum valid)', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 0, provider: 'manual' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(false);
  });

  it('should accept score of 100 (maximum valid)', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 100, provider: 'manual' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(false);
  });

  // ─── Champ score ──────────────────────────────────────────────────────────

  it('should fail when score is missing', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('should fail when score is below 0', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: -1, provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('should fail when score exceeds 100', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 101, provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('should fail when score is not a number', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 'high', provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  // ─── Champ provider ───────────────────────────────────────────────────────

  it('should fail when provider is missing', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'provider')).toBe(true);
  });

  it('should fail when provider is empty string', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72, provider: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'provider')).toBe(true);
  });

  it('should fail when provider is not a string', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72, provider: 42 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'provider')).toBe(true);
  });

  // ─── Champs optionnels ────────────────────────────────────────────────────

  it('should accept undefined details (optional)', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72, provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'details')).toBe(false);
  });

  it('should fail when details is not a string', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72, provider: 'MSCI', details: { E: 70 } });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'details')).toBe(true);
  });

  it('should accept undefined date (optional, defaults to now)', async () => {
    const dto = plainToInstance(CreateEsgScoreDto, { score: 72, provider: 'MSCI' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(false);
  });
});
