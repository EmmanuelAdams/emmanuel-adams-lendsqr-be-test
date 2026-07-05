import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';
import type { KarmaLookupResponse, KarmaRecord } from './adjutor.types';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface AdjutorClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export class AdjutorClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(
    config: AdjutorClientConfig = { baseUrl: env.adjutor.baseUrl, apiKey: env.adjutor.apiKey },
  ) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async lookupKarma(identity: string): Promise<KarmaRecord | null> {
    const url = `${this.baseUrl}/verification/karma/${encodeURIComponent(identity)}`;

    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      logger.error({ err: error, identity }, 'Adjutor Karma request failed');
      throw new ServiceUnavailableError(
        'Unable to verify identity against the blacklist right now.',
      );
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 200) {
      const body = (await response.json()) as KarmaLookupResponse;
      return body.data && Object.keys(body.data).length > 0 ? body.data : null;
    }

    logger.error({ status: response.status, identity }, 'Unexpected Adjutor Karma response');
    throw new ServiceUnavailableError('Unable to verify identity against the blacklist right now.');
  }
}
