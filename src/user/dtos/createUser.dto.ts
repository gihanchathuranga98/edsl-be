import { Permission } from 'src/enums/permissions.enum';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  permissions: Permission[];
}
