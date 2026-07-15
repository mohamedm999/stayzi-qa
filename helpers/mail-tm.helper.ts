import { APIRequestContext } from '@playwright/test';
import { logger } from '@utils/logger';

// ─── Interfaces ─────────────────────────────────────────────

interface MailTmDomain {
  id: string;
  domain: string;
  verification: boolean | null;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DomainsResponse {
  'hydra:member': MailTmDomain[];
}

interface MailTmAccount {
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenResponse {
  token: string;
  id: string;
}

interface MailTmMessage {
  id: string;
  accountId: string;
  msgid: string;
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MessagesResponse {
  'hydra:member': MailTmMessage[];
}

interface FullMessage {
  id: string;
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  subject: string;
  text: string;
  html: string[];
  createdAt: string;
}

interface Inbox {
  address: string;
  password: string;
  accountId: string;
  token: string;
}

// ─── Configuration ──────────────────────────────────────────

const BASE_URL = 'https://api.mail.tm';
const POLL_INTERVAL_MS = 3_000;
const DEFAULT_TIMEOUT_MS = 60_000;

export class MailTmHelper {
  private request: APIRequestContext;
  private inbox: Inbox | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // ─── Inbox Lifecycle ──────────────────────────────────────

  /**
   * Create a disposable inbox: picks a domain, creates account, authenticates.
   */
  async createInbox(): Promise<Inbox> {
    logger.step('Creating temp inbox via mail.tm');

    const domain = await this.getAvailableDomain();
    const localPart = this.randomString(12);
    const address = `${localPart}@${domain}`;
    const password = this.randomString(16);

    const account = await this.createAccount(address, password);
    const token = await this.getToken(address, password);

    this.inbox = { address, password, accountId: account.id, token };
    logger.info(`Inbox created: ${address}`);
    return this.inbox;
  }

  /**
   * Delete the current inbox and reset state.
   */
  async deleteInbox(): Promise<void> {
    if (!this.inbox) {
      logger.warn('No inbox to delete');
      return;
    }

    logger.step(`Deleting inbox: ${this.inbox.address}`);

    const response = await this.request.fetch(`${BASE_URL}/accounts/${this.inbox.accountId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.inbox.token}` },
    });

    if (response.ok()) {
      logger.info(`Inbox deleted: ${this.inbox.address}`);
    } else {
      logger.error(`Failed to delete inbox: ${response.status()}`);
    }

    this.inbox = null;
  }

  // ─── Email Operations ─────────────────────────────────────

  /**
   * Poll inbox until at least one email arrives.
   * Returns the list of message headers.
   */
  async waitForEmail(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<MailTmMessage[]> {
    if (!this.inbox) {
      throw new Error('No inbox. Call createInbox() first.');
    }

    logger.step(`Waiting for email at ${this.inbox.address} (timeout: ${timeoutMs}ms)`);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const messages = await this.listMessages();
      if (messages.length > 0) {
        logger.info(`Email received: ${messages.length} message(s)`);
        return messages;
      }
      await this.sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`No email received at ${this.inbox.address} within ${timeoutMs}ms`);
  }

  /**
   * Get all messages in the inbox.
   */
  async listMessages(): Promise<MailTmMessage[]> {
    if (!this.inbox) {
      throw new Error('No inbox. Call createInbox() first.');
    }

    const response = await this.request.fetch(`${BASE_URL}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.inbox.token}` },
    });

    if (!response.ok()) {
      throw new Error(`Failed to list messages: ${response.status()}`);
    }

    const body = (await response.json()) as MessagesResponse;
    return body['hydra:member'] ?? [];
  }

  /**
   * Get full message content (text + HTML).
   */
  async getMessage(messageId: string): Promise<FullMessage> {
    if (!this.inbox) {
      throw new Error('No inbox. Call createInbox() first.');
    }

    logger.step(`Fetching message: ${messageId}`);

    const response = await this.request.fetch(`${BASE_URL}/messages/${messageId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.inbox.token}` },
    });

    if (!response.ok()) {
      throw new Error(`Failed to get message ${messageId}: ${response.status()}`);
    }

    return (await response.json()) as FullMessage;
  }

  /**
   * Extract OTP code (4–8 digit number) from email content.
   */
  async getOtpCode(messageId: string): Promise<string> {
    const message = await this.getMessage(messageId);
    const content = message.text ?? message.html?.join(' ') ?? '';

    const match = content.match(/\b(\d{4,8})\b/);
    if (!match) {
      throw new Error(`No OTP code found in message ${messageId}`);
    }

    logger.info(`OTP code extracted: ${match[1]}`);
    return match[1];
  }

  /**
   * Convenience: wait for email then extract OTP from the first message.
   */
  async waitForOtp(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<string> {
    const messages = await this.waitForEmail(timeoutMs);
    return this.getOtpCode(messages[0].id);
  }

  // ─── Internal ─────────────────────────────────────────────

  private async getAvailableDomain(): Promise<string> {
    const response = await this.request.fetch(`${BASE_URL}/domains`, {
      method: 'GET',
    });

    if (!response.ok()) {
      throw new Error(`Failed to fetch mail.tm domains: ${response.status()}`);
    }

    const body = (await response.json()) as DomainsResponse;
    const domains = body['hydra:member'];

    if (!domains?.length) {
      throw new Error('No domains available from mail.tm');
    }

    return domains[0].domain;
  }

  private async createAccount(address: string, password: string): Promise<MailTmAccount> {
    return this.withRetry(async () => {
      const response = await this.request.fetch(`${BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { address, password },
      });

      if (!response.ok()) {
        const error = await response.text().catch(() => '');
        throw new Error(`Failed to create account ${address}: ${response.status()} ${error}`);
      }

      return (await response.json()) as MailTmAccount;
    }, `createAccount(${address})`);
  }

  private async getToken(address: string, password: string): Promise<string> {
    return this.withRetry(async () => {
      const response = await this.request.fetch(`${BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { address, password },
      });

      if (!response.ok()) {
        throw new Error(`Failed to get token for ${address}: ${response.status()}`);
      }

      const body = (await response.json()) as TokenResponse;
      return body.token;
    }, `getToken(${address})`);
  }

  private async withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        if (i < attempts - 1) {
          logger.warn(`${label} attempt ${i + 1} failed, retrying...`);
          await this.sleep(1000 * (i + 1));
        }
      }
    }
    throw lastError!;
  }

  private randomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
