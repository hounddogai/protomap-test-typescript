import { GlobalRetentionDigest } from "./global-retention-digest.js";

/** A rule a global retention digest must pass. Check returns its problems, or none. */
export interface GlobalRetentionDigestRule {
  check(item: GlobalRetentionDigest): string[];
}

export class GlobalRetentionDigestRequiredCohortRule implements GlobalRetentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionDigest): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionDigestQuantityRangeRule implements GlobalRetentionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionDigest): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRetentionDigestNameLengthRule implements GlobalRetentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRetentionDigestCohortLengthRule implements GlobalRetentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionDigest): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global retention digest. */
export class GlobalRetentionDigestValidator {
  rules: GlobalRetentionDigestRule[];

  constructor(rules: GlobalRetentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRetentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionDigest[]): Map<string, string[]> {
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

export function defaultGlobalRetentionDigestValidator(): GlobalRetentionDigestValidator {
  return new GlobalRetentionDigestValidator(
    [
      new GlobalRetentionDigestRequiredCohortRule("global retention digest needs an entry"),
      new GlobalRetentionDigestQuantityRangeRule(64, 3600),
      new GlobalRetentionDigestNameLengthRule(80),
      new GlobalRetentionDigestCohortLengthRule(32),
    ],
  );
}
