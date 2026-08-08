import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EsgLabelController } from './esg-label.controller';
import { EsgLabelService } from './esg-label.service';

@Module({
  imports: [PrismaModule],
  controllers: [EsgLabelController],
  providers: [EsgLabelService],
  exports: [EsgLabelService],
})
export class EsgLabelModule {}
