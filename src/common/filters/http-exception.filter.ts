import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
  error?: string;
}

/**
 * Single place where every thrown error (HttpException, TypeORM
 * error, or unexpected runtime error) is translated into a
 * consistent, client-friendly JSON body with the right HTTP status
 * code. This keeps error handling out of controllers/services.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolve(exception);

    const body: ErrorBody = {
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
      error,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode}`);
    }

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { statusCode: exception.getStatus(), message: response };
      }
      const { message, error } = response as {
        message: string | string[];
        error?: string;
      };
      return { statusCode: exception.getStatus(), message, error };
    }

    if (exception instanceof QueryFailedError) {
      // Postgres unique_violation
      const driverError = (exception as QueryFailedError & {
        driverError?: { code?: string; detail?: string };
      }).driverError;

      if (driverError?.code === '23505') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with the given unique field already exists.',
          error: 'Conflict',
        };
      }

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid database request.',
        error: 'Bad Request',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      error: 'Internal Server Error',
    };
  }
}
