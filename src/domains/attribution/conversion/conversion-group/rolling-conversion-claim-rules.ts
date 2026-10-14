import { RollingConversionClaim } from "./rolling-conversion-claim.js";

/** A rule a rolling conversion claim must pass. Check returns its problems, or none. */
export interface RollingConversionClaimRule {
  check(item: RollingConversionClaim): string[];
}

export class RollingConversionClaimContactEmailLengthRule implements RollingConversionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionClaim): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingConversionClaimPinnedGuardRule implements RollingConversionClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingConversionClaim): string[] {
    if (item.pinned && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RollingConversionClaimRateRangeRule implements RollingConversionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingConversionClaim): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingConversionClaimLabelLengthRule implements RollingConversionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling conversion claim. */
export class RollingConversionClaimValidator {
  rules: RollingConversionClaimRule[];

  constructor(rules: RollingConversionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RollingConversionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingConversionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingConversionClaim[]): Map<string, string[]> {
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

export function defaultRollingConversionClaimValidator(): RollingConversionClaimValidator {
  return new RollingConversionClaimValidator(
    [
      new RollingConversionClaimContactEmailLengthRule(32),
      new RollingConversionClaimPinnedGuardRule(1000),
      new RollingConversionClaimRateRangeRule(9.3, 2539.7),
      new RollingConversionClaimLabelLengthRule(32),
    ],
  );
}
