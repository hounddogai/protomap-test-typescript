import { TieredDoubleOptInProfile } from "./tiered-double-opt-in-profile.js";

/** A rule a tiered double opt in profile must pass. Check returns its problems, or none. */
export interface TieredDoubleOptInProfileRule {
  check(item: TieredDoubleOptInProfile): string[];
}

export class TieredDoubleOptInProfileLimitRangeRule implements TieredDoubleOptInProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInProfile): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDoubleOptInProfilePriorityRangeRule implements TieredDoubleOptInProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInProfile): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDoubleOptInProfileLabelLengthRule implements TieredDoubleOptInProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered double opt in profile. */
export class TieredDoubleOptInProfileValidator {
  rules: TieredDoubleOptInProfileRule[];

  constructor(rules: TieredDoubleOptInProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDoubleOptInProfile): string[] {
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

  requireValid(item: TieredDoubleOptInProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDoubleOptInProfile[]): Map<string, string[]> {
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

export function defaultTieredDoubleOptInProfileValidator(): TieredDoubleOptInProfileValidator {
  return new TieredDoubleOptInProfileValidator(
    [
      new TieredDoubleOptInProfileLimitRangeRule(32, 32),
      new TieredDoubleOptInProfilePriorityRangeRule(32, 80),
      new TieredDoubleOptInProfileLabelLengthRule(16),
    ],
  );
}
