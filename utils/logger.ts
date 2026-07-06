import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'step';

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = path.resolve(__dirname, '../../reports/logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Core log method — writes to console + file
   */
  private log(level: LogLevel, message: string, meta?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // Console output
    const consoleFn = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      step: console.log,
    }[level];

    if (meta) {
      consoleFn(`${prefix} ${message}`, meta);
    } else {
      consoleFn(`${prefix} ${message}`);
    }

    // File output
    this.writeToFile(`${prefix} ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`);
  }

  /**
   * Append a line to today's log file
   */
  private writeToFile(line: string): void {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.logDir, `test-${date}.log`);
    fs.appendFileSync(filePath, line + '\n', 'utf-8');
  }

  /** Test step — highlights what the test is doing */
  step(message: string): void {
    this.log('step', `▶ ${message}`);
  }

  /** General information */
  info(message: string, meta?: unknown): void {
    this.log('info', message, meta);
  }

  /** Warning — something unexpected but test continues */
  warn(message: string, meta?: unknown): void {
    this.log('warn', `⚠ ${message}`, meta);
  }

  /** Error — something failed */
  error(message: string, meta?: unknown): void {
    this.log('error', `✗ ${message}`, meta);
  }

  /** Debug — verbose details, only shows when needed */
  debug(message: string, meta?: unknown): void {
    this.log('debug', message, meta);
  }

  /**
   * Log a separator for readability
   */
  separator(title?: string): void {
    const line = '─'.repeat(60);
    this.writeToFile(title ? `\n${line} ${title} ${line}\n` : `\n${line}\n`);
    if (title) {
      console.log(`\n${line} ${title} ${line}`);
    } else {
      console.log(`\n${line}`);
    }
  }
}

export const logger = new Logger();