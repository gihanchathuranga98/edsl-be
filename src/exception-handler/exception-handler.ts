import { HttpException } from '@nestjs/common';
import { ExceptionType } from './exceptionType.enum';
import { ExceptionMetadata } from './exception-metadata';

export class Exceptionhandler extends HttpException {
  private type: ExceptionType;
  private code: number;
  private description: unknown;

  constructor(
    type: ExceptionType,
    description?: unknown,
    customMessage?: string,
  ) {
    const { message, status } = ExceptionMetadata[type];
    super(
      {
        message: customMessage ?? message,
        description: description,
        _description: description,
      },
      status,
    );

    this.type = type;
    this.description = description;
    this.code = type;
  }

  get descriptionDetails(): unknown {
    return this.description;
  }

  get codeDetails(): number {
    return this.code;
  }
}
