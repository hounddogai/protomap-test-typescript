import { FallbackCsatQuota } from "./fallback-csat-quota.js";

/** A rule a fallback csat quota must pass. Check returns its problems, or none. */
export interface FallbackCsatQuotaRule {
  check(item: FallbackCsatQuota): string[];
}

export class FallbackCsatQuotaRequiredTitleRule implements FallbackCsatQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCsatQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCsatQuotaReviewerLengthRule implements FallbackCsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCsatQuota): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCsatQuotaTitleLengthRule implements FallbackCsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCsatQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCsatQuotaCodeLengthRule implements FallbackCsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCsatQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCsatQuotaStartsAtRangeRule implements FallbackCsatQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCsatQuota): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackCsatQuotaRequiredReviewerRule implements FallbackCsatQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCsatQuota): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback csat quota. */
export class FallbackCsatQuotaValidator {
  rules: FallbackCsatQuotaRule[];

  constructor(rules: FallbackCsatQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCsatQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackCsatQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCsatQuota[]): Map<string, string[]> {
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

export function defaultFallbackCsatQuotaValidator(): FallbackCsatQuotaValidator {
  return new FallbackCsatQuotaValidator(
    [
      new FallbackCsatQuotaRequiredTitleRule("fallback csat quota needs an entry"),
      new FallbackCsatQuotaReviewerLengthRule(64),
      new FallbackCsatQuotaTitleLengthRule(32),
      new FallbackCsatQuotaCodeLengthRule(1000),
      new FallbackCsatQuotaStartsAtRangeRule(16, 120),
      new FallbackCsatQuotaRequiredReviewerRule("fallback csat quota needs an entry"),
    ],
  );
}
