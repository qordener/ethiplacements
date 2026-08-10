import { BadRequestException, Controller, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BankImportService } from './bank-import.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo — largement suffisant pour un relevé OFX

@Controller()
export class BankImportController {
  constructor(private readonly bankImportService: BankImportService) {}

  @Post('portfolios/:portfolioId/import/ofx')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  importOfx(
    @Param('portfolioId') portfolioId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('confirm') confirm?: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.bankImportService.importOfx(portfolioId, file.buffer.toString('utf-8'), confirm === 'true');
  }
}
