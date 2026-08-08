import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SyncLabelsDto } from './sync-labels.dto';

describe('SyncLabelsDto', () => {
  it('should be valid with a proper URL', async () => {
    const dto = plainToInstance(SyncLabelsDto, { url: 'https://www.banque-france.fr/system/files/2026-07/referentiel.xlsx' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when url is missing', async () => {
    const dto = plainToInstance(SyncLabelsDto, {});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'url')).toBe(true);
  });

  it('should fail when url is not a valid URL', async () => {
    const dto = plainToInstance(SyncLabelsDto, { url: 'pas-une-url' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'url')).toBe(true);
  });
});
