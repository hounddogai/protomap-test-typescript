import { ScheduledSuppressionQuota } from "./scheduled-suppression-quota.js";

/** A rule a scheduled suppression quota must pass. Check returns its problems, or none. */
export interface ScheduledSuppressionQuotaRule {
  check(item: ScheduledSuppressionQuota): string[];
}

export class ScheduledSuppressionQuotaRequiredTitleRule implements ScheduledSuppressionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSuppressionQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSuppressionQuotaConversionRateRangeRule implements ScheduledSuppressionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSuppressionQuota): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledSuppressionQuotaCohortLengthRule implements ScheduledSuppressionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionQuota): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSuppressionQuotaChecksumLengthRule implements ScheduledSuppressionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionQuota): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSuppressionQuotaRequiredCohortRule implements ScheduledSuppressionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSuppressionQuota): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled suppression quota. */
export class ScheduledSuppressionQuotaValidator {
  rules: ScheduledSuppressionQuotaRule[];

  constructor(rules: ScheduledSuppressionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSuppressionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledSuppressionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSuppressionQuota[]): Map<string, string[]> {
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

export function defaultScheduledSuppressionQuotaValidator(): ScheduledSuppressionQuotaValidator {
  return new ScheduledSuppressionQuotaValidator(
    [
      new ScheduledSuppressionQuotaRequiredTitleRule("scheduled suppression quota needs a value"),
      new ScheduledSuppressionQuotaConversionRateRangeRule(1.8, 1658.1),
      new ScheduledSuppressionQuotaCohortLengthRule(80),
      new ScheduledSuppressionQuotaChecksumLengthRule(255),
      new ScheduledSuppressionQuotaRequiredCohortRule("scheduled suppression quota needs an entry"),
    ],
  );
}
