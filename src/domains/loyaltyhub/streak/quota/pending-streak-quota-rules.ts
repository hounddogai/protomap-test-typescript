import * as text from "../../../../kit/text.js";
import { PendingStreakQuota } from "./pending-streak-quota.js";

/** A rule a pending streak quota must pass. Check returns its problems, or none. */
export interface PendingStreakQuotaRule {
  check(item: PendingStreakQuota): string[];
}

export class PendingStreakQuotaAllowedVariantRule implements PendingStreakQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingStreakQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is below minimum`];
    return [];
  }
}

export class PendingStreakQuotaCodePrefixRule implements PendingStreakQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingStreakQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingStreakQuotaRequiredLabelRule implements PendingStreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakQuotaRequiredPhoneRule implements PendingStreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakQuota): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakQuotaGraceDaysRangeRule implements PendingStreakQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingStreakQuota): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingStreakQuotaRequiredCodeRule implements PendingStreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending streak quota. */
export class PendingStreakQuotaValidator {
  rules: PendingStreakQuotaRule[];

  constructor(rules: PendingStreakQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PendingStreakQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingStreakQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingStreakQuota[]): Map<string, string[]> {
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

export function defaultPendingStreakQuotaValidator(): PendingStreakQuotaValidator {
  return new PendingStreakQuotaValidator(
    [
      new PendingStreakQuotaAllowedVariantRule(["pending", "batched", "fallback"]),
      new PendingStreakQuotaCodePrefixRule("ACM"),
      new PendingStreakQuotaRequiredLabelRule("pending streak quota needs this field"),
      new PendingStreakQuotaRequiredPhoneRule("pending streak quota needs an entry"),
      new PendingStreakQuotaGraceDaysRangeRule(64, 64),
      new PendingStreakQuotaRequiredCodeRule("pending streak quota needs a value"),
    ],
  );
}
