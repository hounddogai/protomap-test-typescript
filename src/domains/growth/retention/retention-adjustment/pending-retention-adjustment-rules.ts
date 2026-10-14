import * as text from "../../../../kit/text.js";
import { PendingRetentionAdjustment } from "./pending-retention-adjustment.js";

/** A rule a pending retention adjustment must pass. Check returns its problems, or none. */
export interface PendingRetentionAdjustmentRule {
  check(item: PendingRetentionAdjustment): string[];
}

export class PendingRetentionAdjustmentAllowedTitleRule implements PendingRetentionAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingRetentionAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class PendingRetentionAdjustmentRequiredTitleRule implements PendingRetentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRetentionAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRetentionAdjustmentTitleLengthRule implements PendingRetentionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRetentionAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRetentionAdjustmentCreatedAtRangeRule implements PendingRetentionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRetentionAdjustment): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingRetentionAdjustmentCodeLengthRule implements PendingRetentionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRetentionAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRetentionAdjustmentCodePrefixRule implements PendingRetentionAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRetentionAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending retention adjustment. */
export class PendingRetentionAdjustmentValidator {
  rules: PendingRetentionAdjustmentRule[];

  constructor(rules: PendingRetentionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRetentionAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingRetentionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRetentionAdjustment[]): Map<string, string[]> {
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

export function defaultPendingRetentionAdjustmentValidator(): PendingRetentionAdjustmentValidator {
  return new PendingRetentionAdjustmentValidator(
    [
      new PendingRetentionAdjustmentAllowedTitleRule(["fallback"]),
      new PendingRetentionAdjustmentRequiredTitleRule("pending retention adjustment needs an entry"),
      new PendingRetentionAdjustmentTitleLengthRule(1000),
      new PendingRetentionAdjustmentCreatedAtRangeRule(64, 64),
      new PendingRetentionAdjustmentCodeLengthRule(255),
      new PendingRetentionAdjustmentCodePrefixRule("OPS"),
    ],
  );
}
