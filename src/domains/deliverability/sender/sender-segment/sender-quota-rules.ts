import { SenderQuota } from "./sender-quota.js";

/** A rule a sender quota must pass. Check returns its problems, or none. */
export interface SenderQuotaRule {
  check(item: SenderQuota): string[];
}

export class SenderQuotaCohortLengthRule implements SenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderQuota): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderQuotaRequiredSummaryRule implements SenderQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SenderQuotaRequiredCohortRule implements SenderQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderQuota): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class SenderQuotaStartsAtRangeRule implements SenderQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderQuota): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderQuotaSummaryLengthRule implements SenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderQuota): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderQuotaCodeLengthRule implements SenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sender quota. */
export class SenderQuotaValidator {
  rules: SenderQuotaRule[];

  constructor(rules: SenderQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SenderQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderQuota[]): Map<string, string[]> {
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

export function defaultSenderQuotaValidator(): SenderQuotaValidator {
  return new SenderQuotaValidator(
    [
      new SenderQuotaCohortLengthRule(16),
      new SenderQuotaRequiredSummaryRule("sender quota needs this field"),
      new SenderQuotaRequiredCohortRule("sender quota needs a value"),
      new SenderQuotaStartsAtRangeRule(120, 1000),
      new SenderQuotaSummaryLengthRule(86400),
      new SenderQuotaCodeLengthRule(120),
    ],
  );
}
