import * as text from "../../../../kit/text.js";
import { QueueQuota } from "./queue-quota.js";

/** A rule a queue quota must pass. Check returns its problems, or none. */
export interface QueueQuotaRule {
  check(item: QueueQuota): string[];
}

export class QueueQuotaOpenRateRangeRule implements QueueQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueQuota): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueQuotaCodeLengthRule implements QueueQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueQuotaCostRangeRule implements QueueQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueQuota): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueQuotaAllowedTitleRule implements QueueQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

/** Runs every rule of a queue quota. */
export class QueueQuotaValidator {
  rules: QueueQuotaRule[];

  constructor(rules: QueueQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: QueueQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: QueueQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueQuota[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultQueueQuotaValidator(): QueueQuotaValidator {
  return new QueueQuotaValidator(
    [
      new QueueQuotaOpenRateRangeRule(7.1, 4079.9),
      new QueueQuotaCodeLengthRule(86400),
      new QueueQuotaCostRangeRule(6.5, 2463.1),
      new QueueQuotaAllowedTitleRule(["regional", "fallback"]),
    ],
  );
}
