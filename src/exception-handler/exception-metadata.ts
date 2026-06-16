import { HttpStatus } from '@nestjs/common';
import { ExceptionType } from './exceptionType.enum';

export const ExceptionMetadata: Record<
  ExceptionType,
  { status: HttpStatus; message: string }
> = {
  [ExceptionType.USER_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'User not found',
  },
  [ExceptionType.INVALID_CREDENTIALS]: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Invalid credentials',
  },
};
