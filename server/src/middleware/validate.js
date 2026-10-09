import { HttpError } from '../utils/HttpError.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(new HttpError(400, 'VALIDATION_ERROR', 'Please check the submitted fields.'));
    req.body = result.data;
    next();
  };
}
