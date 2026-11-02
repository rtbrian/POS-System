import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../errors/app-error';

const isBodyParserError = (
  error: unknown,
): error is Error & { status: number; type: string } =>
  error instanceof Error &&
  'status' in error &&
  typeof error.status === 'number' &&
  'type' in error &&
  typeof error.type === 'string';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (isBodyParserError(error) && error.type === 'entity.parse.failed') {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' },
    });
    return;
  }
  if (isBodyParserError(error) && error.status === 413) {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the allowed size' },
    });
    return;
  }

  console.error('Unhandled request error:', error);
  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
  });
};
