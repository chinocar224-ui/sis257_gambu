import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ReportesService } from './reportes.service';

@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('Administrador')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ventas')
  ventas(@Query('periodo') periodo?: string, @Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.reportesService.ventas(periodo, desde, hasta);
  }
}
