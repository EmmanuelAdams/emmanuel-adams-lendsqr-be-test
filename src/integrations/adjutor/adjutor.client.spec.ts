import { AdjutorClient } from './adjutor.client';
import { ServiceUnavailableError } from '../../common/errors/app-error';
import type { KarmaRecord } from './adjutor.types';

const blacklistedRecord: KarmaRecord = {
  karma_identity: '0zspgifzbo.ga',
  amount_in_contention: '0.00',
  reason: null,
  default_date: '2020-05-18',
  karma_type: { karma: 'Others' },
  karma_identity_type: { identity_type: 'Domain' },
  reporting_entity: { name: 'Blinkcash', email: 'support@blinkcash.ng' },
};

describe('AdjutorClient.lookupKarma', () => {
  const client = new AdjutorClient({
    baseUrl: 'https://adjutor.test/v2',
    apiKey: 'test-key',
    timeoutMs: 1000,
  });

  const mockFetch = (impl: () => Promise<Response>) =>
    jest.spyOn(global, 'fetch').mockImplementation(impl as typeof fetch);

  it('returns null for a clean identity (200 with empty body)', async () => {
    mockFetch(async () => new Response(JSON.stringify({}), { status: 200 }));

    await expect(client.lookupKarma('08000000000')).resolves.toBeNull();
  });

  it('returns the karma record for a blacklisted identity (200 with data)', async () => {
    mockFetch(
      async () =>
        new Response(
          JSON.stringify({ status: 'success', message: 'Successful', data: blacklistedRecord }),
          { status: 200 },
        ),
    );

    await expect(client.lookupKarma('0zspgifzbo.ga')).resolves.toEqual(blacklistedRecord);
  });

  it('treats a 404 as a clean identity', async () => {
    mockFetch(async () => new Response('', { status: 404 }));

    await expect(client.lookupKarma('unknown')).resolves.toBeNull();
  });

  it('fails closed on an unexpected status', async () => {
    mockFetch(async () => new Response('error', { status: 500 }));

    await expect(client.lookupKarma('x')).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('fails closed on a network error or timeout', async () => {
    mockFetch(async () => {
      throw new Error('network down');
    });

    await expect(client.lookupKarma('x')).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('sends the bearer token and url-encodes the identity', async () => {
    const spy = mockFetch(async () => new Response(JSON.stringify({}), { status: 200 }));

    await client.lookupKarma('a b@c');

    expect(spy).toHaveBeenCalledWith(
      'https://adjutor.test/v2/verification/karma/a%20b%40c',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });
});
