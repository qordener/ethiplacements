import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateDepositDto } from './create-deposit.dto';

describe('CreateDepositDto', () => {
  // ─── Cas valides ──────────────────────────────────────────────────────────

  it('should be valid with amount and date', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: 1000, date: '2026-01-15' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with an optional notes field', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: 500, date: '2026-01-15', notes: 'Virement mensuel' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  // ─── Champ amount ─────────────────────────────────────────────────────────

  it('should fail when amount is missing', async () => {
    const dto = plainToInstance(CreateDepositDto, { date: '2026-01-15' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  it('should fail when amount is 0', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: 0, date: '2026-01-15' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  it('should fail when amount is negative', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: -100, date: '2026-01-15' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  // ─── Champ date ───────────────────────────────────────────────────────────

  it('should fail when date is missing', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: 1000 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });

  it('should fail when date is not a valid ISO date', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: 1000, date: 'pas-une-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });

  // ─── Champ notes ──────────────────────────────────────────────────────────

  it('should fail when notes is an empty string', async () => {
    const dto = plainToInstance(CreateDepositDto, { amount: 1000, date: '2026-01-15', notes: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});
