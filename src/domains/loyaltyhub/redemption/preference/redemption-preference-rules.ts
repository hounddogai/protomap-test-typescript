import { RedemptionPreference } from "./redemption-preference.js";

/** A rule a redemption preference must pass. Check returns its problems, or none. */
export interface RedemptionPreferenceRule {
  check(item: RedemptionPreference): string[];
}

export class RedemptionPreferenceBudgetRangeRule implements RedemptionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionPreference): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionPreferenceCodeLengthRule implements RedemptionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionPreferenceDurationMinutesRangeRule implements RedemptionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionPreference): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionPreferenceActiveGuardRule implements RedemptionPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RedemptionPreference): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a redemption preference. */
export class RedemptionPreferenceValidator {
  rules: RedemptionPreferenceRule[];

  constructor(rules: RedemptionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionPreference[]): Map<string, string[]> {
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

export function defaultRedemptionPreferenceValidator(): RedemptionPreferenceValidator {
  return new RedemptionPreferenceValidator(
    [
      new RedemptionPreferenceBudgetRangeRule(2.1, 3522.8),
      new RedemptionPreferenceCodeLengthRule(86400),
      new RedemptionPreferenceDurationMinutesRangeRule(64, 64),
      new RedemptionPreferenceActiveGuardRule(5.1),
    ],
  );
}
