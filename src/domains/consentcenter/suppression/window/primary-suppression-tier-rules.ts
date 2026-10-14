import { PrimarySuppressionTier } from "./primary-suppression-tier.js";

/** A rule a primary suppression tier must pass. Check returns its problems, or none. */
export interface PrimarySuppressionTierRule {
  check(item: PrimarySuppressionTier): string[];
}

export class PrimarySuppressionTierCodePrefixRule implements PrimarySuppressionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySuppressionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySuppressionTierRevisionRangeRule implements PrimarySuppressionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySuppressionTier): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimarySuppressionTierRegionLengthRule implements PrimarySuppressionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySuppressionTier): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary suppression tier. */
export class PrimarySuppressionTierValidator {
  rules: PrimarySuppressionTierRule[];

  constructor(rules: PrimarySuppressionTierRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySuppressionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySuppressionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySuppressionTier[]): Map<string, string[]> {
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

export function defaultPrimarySuppressionTierValidator(): PrimarySuppressionTierValidator {
  return new PrimarySuppressionTierValidator(
    [
      new PrimarySuppressionTierCodePrefixRule("Q"),
      new PrimarySuppressionTierRevisionRangeRule(3600, 86400),
      new PrimarySuppressionTierRegionLengthRule(16),
    ],
  );
}
