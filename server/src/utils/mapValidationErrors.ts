import { ValidationError } from 'class-validator';

export function mapValidationErrors(validationErrors: ValidationError[]) {
  return validationErrors.map((err) => ({
    field: err.property,
    message: err.constraints ? Object.values(err.constraints)[0] : 'not valid',
  }));
}
