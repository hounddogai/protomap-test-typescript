import { ManualBadgeQuota } from "./manual-badge-quota.js";

/** A rule a manual badge quota must pass. Check returns its problems, or none. */
export interface ManualBadgeQuotaRule {
  check(item: ManualBadgeQuota): string[];
}

export class ManualBadgeQuotaAmountRangeRule implements ManualBadgeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBadgeQuota): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBadgeQuotaTitleLengthRule implements ManualBadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBadgeQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBadgeQuotaSegmentLengthRule implements ManualBadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBadgeQuota): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual badge quota. */
export class ManualBadgeQuotaValidator {
  rules: ManualBadgeQuotaRule[];

  constructor(rules: ManualBadgeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBadgeQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBadgeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBadgeQuota[]): Map<string, string[]> {
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

export function defaultManualBadgeQuotaValidator(): ManualBadgeQuotaValidator {
  return new ManualBadgeQuotaValidator(
    [
      new ManualBadgeQuotaAmountRangeRule(9.8, 1696.6),
      new ManualBadgeQuotaTitleLengthRule(80),
      new ManualBadgeQuotaSegmentLengthRule(1000),
    ],
  );
}
