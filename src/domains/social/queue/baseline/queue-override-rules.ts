import * as text from "../../../../kit/text.js";
import { QueueOverride } from "./queue-override.js";

/** A rule a queue override must pass. Check returns its problems, or none. */
export interface QueueOverrideRule {
  check(item: QueueOverride): string[];
}

export class QueueOverrideRetriesRangeRule implements QueueOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueOverride): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueOverrideCodeLengthRule implements QueueOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueOverrideCodePrefixRule implements QueueOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueOverrideCeilingRangeRule implements QueueOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueOverride): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueOverrideAllowedReviewerRule implements QueueOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is unknown`];
    return [];
  }
}

export class QueueOverrideRatioRangeRule implements QueueOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueOverride): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a queue override. */
export class QueueOverrideValidator {
  rules: QueueOverrideRule[];

  constructor(rules: QueueOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: QueueOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueOverride[]): Map<string, string[]> {
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

export function defaultQueueOverrideValidator(): QueueOverrideValidator {
  return new QueueOverrideValidator(
    [
      new QueueOverrideRetriesRangeRule(16, 1000),
      new QueueOverrideCodeLengthRule(120),
      new QueueOverrideCodePrefixRule("ACM"),
      new QueueOverrideCeilingRangeRule(4.3, 3125.2),
      new QueueOverrideAllowedReviewerRule(["pending"]),
      new QueueOverrideRatioRangeRule(2.5, 1805.3),
    ],
  );
}
