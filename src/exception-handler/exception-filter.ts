import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Exceptionhandler } from './exception-handler';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = -1;
    let description: unknown = null;
    let errorName = (exception as any)?.name ?? 'UnknownError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as any;
      message = response.message || message;
      code = response.code || code;
      description = response.description; // fix here
    }

    if (exception instanceof Exceptionhandler) {
      code = exception.codeDetails ?? code;
      description = exception.descriptionDetails ?? description; // exception.descriptionDetails <- getter method in the ExceptionHandler class
      // message = exception.getResponse()?.message ?? message; // check this as well
    } else {
      message = exception.message || message;
      errorName = exception.name;
    }

    const payload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url || null,
      code,
      message,
      description,
      error: errorName,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Unhandled exception :', exception);
    }

    response.status(status).json(payload);
  }
}
