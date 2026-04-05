import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTransactionDto } from './create-transaction.dto';

describe('CreateTransactionDto', () => {
  const validDate = '2024-01-15T00:00:00.000Z';

  // ─── Cas valides ──────────────────────────────────────────────────────────

  it('should be valid with BUY, quantity, price, and date', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with SELL type', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'SELL', quantity: 5, price: 130, date: validDate });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with optional notes', async () => {
    const dto = plainToInstance(CreateTransactionDto, {
      type: 'BUY',
      quantity: 3,
      price: 200,
      date: validDate,
      notes: 'Premier achat',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept decimal quantity (fractional shares)', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 0.25, price: 1000, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(false);
  });

  // ─── Champ type ───────────────────────────────────────────────────────────

  it('should fail when type is missing', async () => {
    const dto = plainToInstance(CreateTransactionDto, { quantity: 10, price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('should fail when type is not BUY or SELL', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'HOLD', quantity: 10, price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  // ─── Champ quantity ───────────────────────────────────────────────────────

  it('should fail when quantity is missing', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('should fail when quantity is 0', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 0, price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('should fail when quantity is negative', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: -1, price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  // ─── Champ price ──────────────────────────────────────────────────────────

  it('should fail when price is missing', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('should fail when price is 0', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: 0, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('should fail when price is negative', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: -50, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  // ─── Champ date ───────────────────────────────────────────────────────────

  it('should fail when date is missing', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: 100 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });

  it('should fail when date is not a valid ISO 8601 date', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: 100, date: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'date')).toBe(true);
  });

  // ─── Champ notes ──────────────────────────────────────────────────────────

  it('should accept undefined notes (optional)', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: 100, date: validDate });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(false);
  });

  it('should fail when notes is not a string', async () => {
    const dto = plainToInstance(CreateTransactionDto, { type: 'BUY', quantity: 10, price: 100, date: validDate, notes: 42 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});
