import { DefaultEnrollmentDigest } from "./default-enrollment-digest.js";

/** A rule a default enrollment digest must pass. Check returns its problems, or none. */
export interface DefaultEnrollmentDigestRule {
  check(item: DefaultEnrollmentDigest): string[];
}

export class DefaultEnrollmentDigestOpenRateRangeRule implements DefaultEnrollmentDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEnrollmentDigest): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultEnrollmentDigestRequiredTitleRule implements DefaultEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultEnrollmentDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultEnrollmentDigestTitleLengthRule implements DefaultEnrollmentDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEnrollmentDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultEnrollmentDigestCostRangeRule implements DefaultEnrollmentDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEnrollmentDigest): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default enrollment digest. */
export class DefaultEnrollmentDigestValidator {
  rules: DefaultEnrollmentDigestRule[];

  constructor(rules: DefaultEnrollmentDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultEnrollmentDigest): string[] {
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

  requireValid(item: DefaultEnrollmentDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultEnrollmentDigest[]): Map<string, string[]> {
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

export function defaultDefaultEnrollmentDigestValidator(): DefaultEnrollmentDigestValidator {
  return new DefaultEnrollmentDigestValidator(
    [
      new DefaultEnrollmentDigestOpenRateRangeRule(8.4, 1723.4),
      new DefaultEnrollmentDigestRequiredTitleRule("default enrollment digest needs an entry"),
      new DefaultEnrollmentDigestTitleLengthRule(3600),
      new DefaultEnrollmentDigestCostRangeRule(2.8, 1646.7),
    ],
  );
}
