import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

const tokenFromEventSourceQuery = (request: any): string | null => {
  const token = request?.query?.token;
  return typeof token === 'string' && token.trim() ? token : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        tokenFromEventSourceQuery,
      ]),
      secretOrKey: process.env.JWT_TOKEN ?? 'default_secret',
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    return await this.authService.verifyPayload(payload);
  }
}
