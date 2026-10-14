import { PrimaryDoubleOptInQuota } from "./primary-double-opt-in-quota.js";

/** A rule a primary double opt in quota must pass. Check returns its problems, or none. */
export interface PrimaryDoubleOptInQuotaRule {
  check(item: PrimaryDoubleOptInQuota): string[];
}

export class PrimaryDoubleOptInQuotaCodePrefixRule implements PrimaryDoubleOptInQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryDoubleOptInQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryDoubleOptInQuotaOpenRateRangeRule implements PrimaryDoubleOptInQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDoubleOptInQuota): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryDoubleOptInQuotaLabelLengthRule implements PrimaryDoubleOptInQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDoubleOptInQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary double opt in quota. */
export class PrimaryDoubleOptInQuotaValidator {
  rules: PrimaryDoubleOptInQuotaRule[];

  constructor(rules: PrimaryDoubleOptInQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDoubleOptInQuota): string[] {
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

  requireValid(item: PrimaryDoubleOptInQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDoubleOptInQuota[]): Map<string, string[]> {
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

export function defaultPrimaryDoubleOptInQuotaValidator(): PrimaryDoubleOptInQuotaValidator {
  return new PrimaryDoubleOptInQuotaValidator(
    [
      new PrimaryDoubleOptInQuotaCodePrefixRule("REF"),
      new PrimaryDoubleOptInQuotaOpenRateRangeRule(4.2, 900.4),
      new PrimaryDoubleOptInQuotaLabelLengthRule(32),
    ],
  );
}
