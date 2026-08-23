import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * AuthGuard - Guard to check if the user is authenticated
 * extract and decode the JWT token and gets the user object
 */

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: any = context.switchToHttp().getRequest();
    const authHeader = this.extractTokenFromHeader(request);
    if (!authHeader) {
      throw new UnauthorizedException(
        'Authorization header missing or invalid',
      );
    }

    try {
      const decoded: unknown = this.jwtService.verify(authHeader);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.cookies?.accessToken?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
