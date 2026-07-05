import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import '../domain/auth/auth.docs';
import '../domain/wallet/wallet.docs';

export const openApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Demo Credit Wallet API',
      version: '1.0.0',
      description: 'MVP wallet service for a mobile lending app. Amounts are in kobo.',
    },
    servers: [{ url: '/', description: 'Current host' }],
  });
};
