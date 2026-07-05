import { SuccessResponse } from './success-response';
import { ErrorResponse } from './error-response';

describe('SuccessResponse', () => {
  it('wraps data with success=true and a default message', () => {
    const response = new SuccessResponse({ id: 1 });

    expect(response.success).toBe(true);
    expect(response.message).toBe('Request successful');
    expect(response.data).toEqual({ id: 1 });
  });

  it('accepts a custom message', () => {
    const response = new SuccessResponse({ id: 1 }, 'Wallet funded');

    expect(response.message).toBe('Wallet funded');
  });

  it('defaults data to an empty object when none is provided', () => {
    const response = new SuccessResponse();

    expect(response.data).toEqual({});
  });
});

describe('ErrorResponse', () => {
  it('sets success=false and carries the message', () => {
    const response = new ErrorResponse('Something went wrong');

    expect(response.success).toBe(false);
    expect(response.message).toBe('Something went wrong');
  });

  it('omits the errors field from the serialized body when no details are supplied', () => {
    const body = JSON.parse(JSON.stringify(new ErrorResponse('Bad request')));

    expect(body).not.toHaveProperty('errors');
  });

  it('includes structured errors when provided', () => {
    const details = { email: ['is required'] };
    const response = new ErrorResponse('Validation failed', details);

    expect(response.errors).toEqual(details);
  });
});
