import { ManualSuppressionProfile } from "./manual-suppression-profile.js";

/** A rule a manual suppression profile must pass. Check returns its problems, or none. */
export interface ManualSuppressionProfileRule {
  check(item: ManualSuppressionProfile): string[];
}

export class ManualSuppressionProfileNameLengthRule implements ManualSuppressionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSuppressionProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualSuppressionProfileUpdatedAtRangeRule implements ManualSuppressionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSuppressionProfile): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualSuppressionProfileRateRangeRule implements ManualSuppressionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSuppressionProfile): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual suppression profile. */
export class ManualSuppressionProfileValidator {
  rules: ManualSuppressionProfileRule[];

  constructor(rules: ManualSuppressionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSuppressionProfile): string[] {
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

  requireValid(item: ManualSuppressionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSuppressionProfile[]): Map<string, string[]> {
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

export function defaultManualSuppressionProfileValidator(): ManualSuppressionProfileValidator {
  return new ManualSuppressionProfileValidator(
    [
      new ManualSuppressionProfileNameLengthRule(80),
      new ManualSuppressionProfileUpdatedAtRangeRule(32, 255),
      new ManualSuppressionProfileRateRangeRule(2.4, 3194.9),
    ],
  );
}
