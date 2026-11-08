// src/demo/server/errors.ts
/**
 * Simulated server error classes and helpers matching the production error envelope.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: unknown) {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details?: unknown) {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND', details?: unknown) {
    return new ApiError(404, message, code, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details?: unknown) {
    return new ApiError(409, message, code, details);
  }

  static unprocessable(message = 'Unprocessable entity', code = 'UNPROCESSABLE_ENTITY', details?: unknown) {
    return new ApiError(422, message, code, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details?: unknown) {
    return new ApiError(500, message, code, details);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    };
  }
}

