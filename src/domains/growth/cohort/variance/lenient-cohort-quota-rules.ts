import { LenientCohortQuota } from "./lenient-cohort-quota.js";

/** A rule a lenient cohort quota must pass. Check returns its problems, or none. */
export interface LenientCohortQuotaRule {
  check(item: LenientCohortQuota): string[];
}

export class LenientCohortQuotaNameLengthRule implements LenientCohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCohortQuotaLabelLengthRule implements LenientCohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCohortQuotaCodeLengthRule implements LenientCohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient cohort quota. */
export class LenientCohortQuotaValidator {
  rules: LenientCohortQuotaRule[];

  constructor(rules: LenientCohortQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCohortQuota): string[] {
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

  requireValid(item: LenientCohortQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCohortQuota[]): Map<string, string[]> {
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

export function defaultLenientCohortQuotaValidator(): LenientCohortQuotaValidator {
  return new LenientCohortQuotaValidator(
    [
      new LenientCohortQuotaNameLengthRule(86400),
      new LenientCohortQuotaLabelLengthRule(16),
      new LenientCohortQuotaCodeLengthRule(120),
    ],
  );
}
