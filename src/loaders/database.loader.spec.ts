import type { Knex } from 'knex';
import { connectDatabase } from './database.loader';

const knexWith = (raw: jest.Mock): Knex => ({ raw }) as unknown as Knex;

describe('connectDatabase', () => {
  it('resolves and pings the database when the connection is healthy', async () => {
    const raw = jest.fn().mockResolvedValue([[{ '1': 1 }]]);

    await expect(connectDatabase(knexWith(raw))).resolves.toBeUndefined();
    expect(raw).toHaveBeenCalledWith('SELECT 1');
  });

  it('rejects when the database is unreachable', async () => {
    const raw = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(connectDatabase(knexWith(raw))).rejects.toThrow('ECONNREFUSED');
  });
});
