import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQ_PERMISSION_KEY } from 'src/decorators/requirePermission.decorator';

interface UserWithPermissions {
  permissions?: string[];
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req: { user?: UserWithPermissions } | undefined = context
      .switchToHttp()
      .getRequest();

    const user = req?.user;
    const requiredPermissions: string[] =
      this.reflector.get<string[]>(REQ_PERMISSION_KEY, context.getHandler()) ||
      [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    if (
      user?.permissions &&
      requiredPermissions.some((perm) => user.permissions!.includes(perm))
    ) {
      return true;
    }

    return false;
  }
}
