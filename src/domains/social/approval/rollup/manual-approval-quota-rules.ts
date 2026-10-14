import { ManualApprovalQuota } from "./manual-approval-quota.js";

/** A rule a manual approval quota must pass. Check returns its problems, or none. */
export interface ManualApprovalQuotaRule {
  check(item: ManualApprovalQuota): string[];
}

export class ManualApprovalQuotaTimezoneLengthRule implements ManualApprovalQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualApprovalQuota): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualApprovalQuotaThresholdRangeRule implements ManualApprovalQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualApprovalQuota): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualApprovalQuotaCodePrefixRule implements ManualApprovalQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualApprovalQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualApprovalQuotaBudgetRangeRule implements ManualApprovalQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualApprovalQuota): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual approval quota. */
export class ManualApprovalQuotaValidator {
  rules: ManualApprovalQuotaRule[];

  constructor(rules: ManualApprovalQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualApprovalQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualApprovalQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualApprovalQuota[]): Map<string, string[]> {
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

export function defaultManualApprovalQuotaValidator(): ManualApprovalQuotaValidator {
  return new ManualApprovalQuotaValidator(
    [
      new ManualApprovalQuotaTimezoneLengthRule(64),
      new ManualApprovalQuotaThresholdRangeRule(1.8, 4400.9),
      new ManualApprovalQuotaCodePrefixRule("ACM"),
      new ManualApprovalQuotaBudgetRangeRule(7.7, 2279.4),
    ],
  );
}
