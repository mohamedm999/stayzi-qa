import { APIRequestContext } from '@playwright/test';
import { logger } from '@lib/logger';

interface TimingResult {
  duration: number;
  status: number;
}

interface TimingStats {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  samples: number;
}

export class TimingHelper {
  private request: APIRequestContext;
  private baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  async measureLoginTime(email: string, password: string): Promise<TimingResult> {
    const start = Date.now();
    const response = await this.request.fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { email, password },
    });
    const duration = Date.now() - start;
    return { duration, status: response.status() };
  }

  async measureEndpointTime(
    method: string,
    endpoint: string,
    options?: { headers?: Record<string, string>; data?: unknown }
  ): Promise<TimingResult> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const start = Date.now();
    const response = await this.request.fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      data: options?.data,
    });
    const duration = Date.now() - start;
    return { duration, status: response.status() };
  }

  async collectSamples(
    email: string,
    password: string,
    count: number = 10,
    delayMs: number = 200
  ): Promise<TimingResult[]> {
    const samples: TimingResult[] = [];
    for (let i = 0; i < count; i++) {
      samples.push(await this.measureLoginTime(email, password));
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return samples;
  }

  computeStats(results: TimingResult[]): TimingStats {
    const durations = results.map(r => r.duration);
    const n = durations.length;
    const mean = durations.reduce((a, b) => a + b, 0) / n;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / n;
    const stddev = Math.sqrt(variance);
    return {
      mean,
      stddev,
      min: Math.min(...durations),
      max: Math.max(...durations),
      samples: n,
    };
  }

  hasSignificantDifference(baseline: TimingStats, sample: TimingStats, thresholdStdDevs: number = 2): boolean {
    const diff = Math.abs(baseline.mean - sample.mean);
    const combinedStd = Math.sqrt(baseline.stddev ** 2 + sample.stddev ** 2);
    return diff > thresholdStdDevs * combinedStd;
  }
}
