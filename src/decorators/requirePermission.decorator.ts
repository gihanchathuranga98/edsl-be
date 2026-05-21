import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/enums/permissions.enum';

export const REQ_PERMISSION_KEY = 'required_permissions';
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQ_PERMISSION_KEY, permissions);
