import { ComplaintPreference } from "./complaint-preference.js";

/** A rule a complaint preference must pass. Check returns its problems, or none. */
export interface ComplaintPreferenceRule {
  check(item: ComplaintPreference): string[];
}

export class ComplaintPreferenceClicksRangeRule implements ComplaintPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintPreference): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintPreferenceFrequencyCapRangeRule implements ComplaintPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintPreference): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintPreferenceExternalRefLengthRule implements ComplaintPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintPreference): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintPreferenceRequiredTitleRule implements ComplaintPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint preference. */
export class ComplaintPreferenceValidator {
  rules: ComplaintPreferenceRule[];

  constructor(rules: ComplaintPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintPreference[]): Map<string, string[]> {
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

export function defaultComplaintPreferenceValidator(): ComplaintPreferenceValidator {
  return new ComplaintPreferenceValidator(
    [
      new ComplaintPreferenceClicksRangeRule(64, 80),
      new ComplaintPreferenceFrequencyCapRangeRule(32, 64),
      new ComplaintPreferenceExternalRefLengthRule(80),
      new ComplaintPreferenceRequiredTitleRule("complaint preference needs this field"),
    ],
  );
}
