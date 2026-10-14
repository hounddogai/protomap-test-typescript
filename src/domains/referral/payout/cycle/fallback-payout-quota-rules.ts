import * as text from "../../../../kit/text.js";
import { FallbackPayoutQuota } from "./fallback-payout-quota.js";

/** A rule a fallback payout quota must pass. Check returns its problems, or none. */
export interface FallbackPayoutQuotaRule {
  check(item: FallbackPayoutQuota): string[];
}

export class FallbackPayoutQuotaUpdatedAtRangeRule implements FallbackPayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutQuota): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPayoutQuotaCodeLengthRule implements FallbackPayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPayoutQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPayoutQuotaMaximumRangeRule implements FallbackPayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutQuota): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPayoutQuotaAllowedCodeRule implements FallbackPayoutQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPayoutQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class FallbackPayoutQuotaSendAtRangeRule implements FallbackPayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutQuota): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback payout quota. */
export class FallbackPayoutQuotaValidator {
  rules: FallbackPayoutQuotaRule[];

  constructor(rules: FallbackPayoutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPayoutQuota): string[] {
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

  requireValid(item: FallbackPayoutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPayoutQuota[]): Map<string, string[]> {
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

export function defaultFallbackPayoutQuotaValidator(): FallbackPayoutQuotaValidator {
  return new FallbackPayoutQuotaValidator(
    [
      new FallbackPayoutQuotaUpdatedAtRangeRule(120, 86400),
      new FallbackPayoutQuotaCodeLengthRule(64),
      new FallbackPayoutQuotaMaximumRangeRule(7.2, 3704.5),
      new FallbackPayoutQuotaAllowedCodeRule(["strict", "pending"]),
      new FallbackPayoutQuotaSendAtRangeRule(16, 64),
    ],
  );
}
