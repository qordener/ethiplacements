import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePortfolioDto } from './create-portfolio.dto';

describe('CreatePortfolioDto', () => {
  it('should be valid with name only', async () => {
    const dto = plainToInstance(CreatePortfolioDto, { name: 'Mon portefeuille' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with name and description', async () => {
    const dto = plainToInstance(CreatePortfolioDto, {
      name: 'Mon ISR',
      description: 'Placements éthiques uniquement',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when name is missing', async () => {
    const dto = plainToInstance(CreatePortfolioDto, {});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when name is an empty string', async () => {
    const dto = plainToInstance(CreatePortfolioDto, { name: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when name is not a string', async () => {
    const dto = plainToInstance(CreatePortfolioDto, { name: 42 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should accept undefined description (optional field)', async () => {
    const dto = plainToInstance(CreatePortfolioDto, { name: 'Test' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(false);
  });
});
