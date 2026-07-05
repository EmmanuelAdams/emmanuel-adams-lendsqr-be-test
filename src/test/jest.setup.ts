process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.ADJUTOR_API_KEY = process.env.ADJUTOR_API_KEY ?? 'test-adjutor-key';
process.env.ADJUTOR_BASE_URL = process.env.ADJUTOR_BASE_URL ?? 'https://adjutor.lendsqr.com/v2';
