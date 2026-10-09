import { HttpError } from '../utils/HttpError.js';

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  const malformed = error.type === 'entity.parse.failed';
  const tooLarge = error.type === 'entity.too.large';
  const status = malformed ? 400 : tooLarge ? 413 : 500;
  res.status(status).json({
    error: {
      code: malformed ? 'INVALID_JSON' : tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR',
      message: malformed ? 'Request body must be valid JSON.' : tooLarge ? 'Request body is too large.' : 'An unexpected error occurred.',
    },
  });
}
