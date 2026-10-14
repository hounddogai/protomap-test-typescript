import { AdaptivePayoutQuota } from "./adaptive-payout-quota.js";

/** A rule a adaptive payout quota must pass. Check returns its problems, or none. */
export interface AdaptivePayoutQuotaRule {
  check(item: AdaptivePayoutQuota): string[];
}

export class AdaptivePayoutQuotaBudgetRangeRule implements AdaptivePayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePayoutQuota): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptivePayoutQuotaCountryLengthRule implements AdaptivePayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePayoutQuota): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePayoutQuotaRequiredLabelRule implements AdaptivePayoutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePayoutQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePayoutQuotaLabelLengthRule implements AdaptivePayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePayoutQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive payout quota. */
export class AdaptivePayoutQuotaValidator {
  rules: AdaptivePayoutQuotaRule[];

  constructor(rules: AdaptivePayoutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePayoutQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePayoutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePayoutQuota[]): Map<string, string[]> {
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

export function defaultAdaptivePayoutQuotaValidator(): AdaptivePayoutQuotaValidator {
  return new AdaptivePayoutQuotaValidator(
    [
      new AdaptivePayoutQuotaBudgetRangeRule(10, 2557.6),
      new AdaptivePayoutQuotaCountryLengthRule(255),
      new AdaptivePayoutQuotaRequiredLabelRule("adaptive payout quota needs this field"),
      new AdaptivePayoutQuotaLabelLengthRule(80),
    ],
  );
}
