import { EnrollmentOverride } from "./enrollment-override.js";

/** A rule a enrollment override must pass. Check returns its problems, or none. */
export interface EnrollmentOverrideRule {
  check(item: EnrollmentOverride): string[];
}

export class EnrollmentOverrideRequiredTitleRule implements EnrollmentOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentOverrideDurationMinutesRangeRule implements EnrollmentOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentOverride): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentOverrideCountryLengthRule implements EnrollmentOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentOverride): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment override. */
export class EnrollmentOverrideValidator {
  rules: EnrollmentOverrideRule[];

  constructor(rules: EnrollmentOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentOverride): string[] {
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

  requireValid(item: EnrollmentOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentOverride[]): Map<string, string[]> {
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

export function defaultEnrollmentOverrideValidator(): EnrollmentOverrideValidator {
  return new EnrollmentOverrideValidator(
    [
      new EnrollmentOverrideRequiredTitleRule("enrollment override needs a value"),
      new EnrollmentOverrideDurationMinutesRangeRule(64, 86400),
      new EnrollmentOverrideCountryLengthRule(80),
    ],
  );
}
