import * as text from "../../../../kit/text.js";
import { QueueClaim } from "./queue-claim.js";

/** A rule a queue claim must pass. Check returns its problems, or none. */
export interface QueueClaimRule {
  check(item: QueueClaim): string[];
}

export class QueueClaimExpiresAtRangeRule implements QueueClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueClaim): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueClaimAllowedLocaleRule implements QueueClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is blocked`];
    return [];
  }
}

export class QueueClaimCodeLengthRule implements QueueClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueClaimCreatedAtRangeRule implements QueueClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueClaim): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueClaimLocaleLengthRule implements QueueClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueClaim): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueClaimSegmentLengthRule implements QueueClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueClaim): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue claim. */
export class QueueClaimValidator {
  rules: QueueClaimRule[];

  constructor(rules: QueueClaimRule[]) {
    this.rules = rules;
  }

  validate(item: QueueClaim): string[] {
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

  requireValid(item: QueueClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueClaim[]): Map<string, string[]> {
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

export function defaultQueueClaimValidator(): QueueClaimValidator {
  return new QueueClaimValidator(
    [
      new QueueClaimExpiresAtRangeRule(255, 86400),
      new QueueClaimAllowedLocaleRule([]),
      new QueueClaimCodeLengthRule(64),
      new QueueClaimCreatedAtRangeRule(120, 120),
      new QueueClaimLocaleLengthRule(86400),
      new QueueClaimSegmentLengthRule(16),
    ],
  );
}
