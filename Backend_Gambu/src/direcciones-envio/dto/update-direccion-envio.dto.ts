import { PartialType } from '@nestjs/swagger';
import { CreateDireccionEnvioDto } from './create-direccion-envio.dto';

export class UpdateDireccionEnvioDto extends PartialType(CreateDireccionEnvioDto) {}
