import { PendingBouncePreference } from "./pending-bounce-preference.js";

/** A rule a pending bounce preference must pass. Check returns its problems, or none. */
export interface PendingBouncePreferenceRule {
  check(item: PendingBouncePreference): string[];
}

export class PendingBouncePreferenceCodeLengthRule implements PendingBouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBouncePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBouncePreferenceThresholdRangeRule implements PendingBouncePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBouncePreference): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBouncePreferenceLabelLengthRule implements PendingBouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBouncePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBouncePreferenceRequiredCodeRule implements PendingBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBouncePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending bounce preference. */
export class PendingBouncePreferenceValidator {
  rules: PendingBouncePreferenceRule[];

  constructor(rules: PendingBouncePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBouncePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBouncePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBouncePreference[]): Map<string, string[]> {
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

export function defaultPendingBouncePreferenceValidator(): PendingBouncePreferenceValidator {
  return new PendingBouncePreferenceValidator(
    [
      new PendingBouncePreferenceCodeLengthRule(3600),
      new PendingBouncePreferenceThresholdRangeRule(4.7, 1657.3),
      new PendingBouncePreferenceLabelLengthRule(1000),
      new PendingBouncePreferenceRequiredCodeRule("pending bounce preference needs this field"),
    ],
  );
}
