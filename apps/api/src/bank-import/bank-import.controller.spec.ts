import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BankImportController } from './bank-import.controller';
import { BankImportService } from './bank-import.service';

const mockBankImportService = { importOfx: vi.fn() };

function fakeFile(content: string): Express.Multer.File {
  return {
    buffer: Buffer.from(content, 'utf-8'),
    fieldname: 'file',
    originalname: 'releve.ofx',
    encoding: '7bit',
    mimetype: 'application/x-ofx',
    size: content.length,
  } as Express.Multer.File;
}

describe('BankImportController', () => {
  let controller: BankImportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankImportController],
      providers: [{ provide: BankImportService, useValue: mockBankImportService }],
    }).compile();

    controller = module.get<BankImportController>(BankImportController);
    vi.clearAllMocks();
  });

  it('should throw BadRequestException when no file is provided', () => {
    expect(() => controller.importOfx('p1', undefined as unknown as Express.Multer.File, undefined))
      .toThrow(BadRequestException);
  });

  it('should call the service with the file content and confirm=false by default', () => {
    mockBankImportService.importOfx.mockReturnValue(Promise.resolve({ transactions: [], deposits: [] }));

    controller.importOfx('p1', fakeFile('<OFX></OFX>'), undefined);

    expect(mockBankImportService.importOfx).toHaveBeenCalledWith('p1', '<OFX></OFX>', false);
  });

  it('should pass confirm=true when the query param is "true"', () => {
    mockBankImportService.importOfx.mockReturnValue(Promise.resolve({ transactions: [], deposits: [] }));

    controller.importOfx('p1', fakeFile('<OFX></OFX>'), 'true');

    expect(mockBankImportService.importOfx).toHaveBeenCalledWith('p1', '<OFX></OFX>', true);
  });
});
