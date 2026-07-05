import { Response } from './response';

export class SuccessResponse<T = unknown> extends Response {
  message: string;
  data: T;

  constructor(data?: T | null, message = 'Request successful') {
    super();
    this.success = true;
    this.message = message;
    this.data = (data ?? {}) as T;
  }
}
