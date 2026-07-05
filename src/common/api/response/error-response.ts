import { Response } from './response';

export class ErrorResponse extends Response {
  message: string;
  errors?: unknown;

  constructor(message: string, errors?: unknown) {
    super();
    this.success = false;
    this.message = message;
    if (errors !== undefined) {
      this.errors = errors;
    }
  }
}
