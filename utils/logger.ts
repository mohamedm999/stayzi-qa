import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'step' | 'success';

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = path.resolve(__dirname, '../../reports/logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private timestamp(): string {
    return new Date().toISOString().slice(11, 19);
  }

  private log(level: LogLevel, message: string, meta?: unknown): void {
    const ts = chalk.dim(this.timestamp());

    const styled = {
      step:     `${ts} ${chalk.green('▶')} ${chalk.green(message)}`,
      info:     `${ts} ${chalk.cyan('ℹ')} ${message}`,
      warn:     `${ts} ${chalk.yellow('⚠')} ${chalk.yellow(message)}`,
      error:    `${ts} ${chalk.red('✗')} ${chalk.red(message)}`,
      success:  `${ts} ${chalk.green('✓')} ${chalk.green(message)}`,
      debug:    `${ts} ${chalk.dim('·')} ${chalk.dim(message)}`,
    }[level];

    const consoleFn = level === 'error' ? console.error
                    : level === 'warn'  ? console.warn
                    : console.log;

    if (meta) {
      consoleFn(`${styled} ${JSON.stringify(meta)}`);
    } else {
      consoleFn(styled);
    }

    this.writeToFile(`${this.timestamp()} [${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`);
  }

  private writeToFile(line: string): void {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.logDir, `test-${date}.log`);
    fs.appendFileSync(filePath, line + '\n', 'utf-8');
  }

  step(message: string): void {
    this.log('step', message);
  }

  info(message: string, meta?: unknown): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.log('error', message, meta);
  }

  success(message: string): void {
    this.log('success', message);
  }

  debug(message: string, meta?: unknown): void {
    this.log('debug', message, meta);
  }

  separator(title?: string): void {
    const line = chalk.dim('─'.repeat(50));
    if (title) {
      console.log(`\n${line} ${chalk.bold(title)} ${line}`);
    } else {
      console.log(`\n${line}`);
    }
  }
}

export const logger = new Logger();
