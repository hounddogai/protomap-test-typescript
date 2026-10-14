import { LegacyRedemptionBundle } from "./legacy-redemption-bundle.js";

/** A rule a legacy redemption bundle must pass. Check returns its problems, or none. */
export interface LegacyRedemptionBundleRule {
  check(item: LegacyRedemptionBundle): string[];
}

export class LegacyRedemptionBundleReviewerLengthRule implements LegacyRedemptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRedemptionBundle): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyRedemptionBundleRetriesRangeRule implements LegacyRedemptionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRedemptionBundle): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyRedemptionBundleRequiredReviewerRule implements LegacyRedemptionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRedemptionBundle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRedemptionBundleUnitLengthRule implements LegacyRedemptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRedemptionBundle): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy redemption bundle. */
export class LegacyRedemptionBundleValidator {
  rules: LegacyRedemptionBundleRule[];

  constructor(rules: LegacyRedemptionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRedemptionBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyRedemptionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRedemptionBundle[]): Map<string, string[]> {
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

export function defaultLegacyRedemptionBundleValidator(): LegacyRedemptionBundleValidator {
  return new LegacyRedemptionBundleValidator(
    [
      new LegacyRedemptionBundleReviewerLengthRule(32),
      new LegacyRedemptionBundleRetriesRangeRule(64, 86400),
      new LegacyRedemptionBundleRequiredReviewerRule("legacy redemption bundle needs a value"),
      new LegacyRedemptionBundleUnitLengthRule(32),
    ],
  );
}
