import { LenientCreditPreference } from "./lenient-credit-preference.js";

/** A rule a lenient credit preference must pass. Check returns its problems, or none. */
export interface LenientCreditPreferenceRule {
  check(item: LenientCreditPreference): string[];
}

export class LenientCreditPreferenceRequiredContactEmailRule implements LenientCreditPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreditPreference): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreditPreferenceSummaryLengthRule implements LenientCreditPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCreditPreference): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCreditPreferenceCodeLengthRule implements LenientCreditPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCreditPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCreditPreferenceFrequencyCapRangeRule implements LenientCreditPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreditPreference): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientCreditPreferenceRequiredTitleRule implements LenientCreditPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreditPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient credit preference. */
export class LenientCreditPreferenceValidator {
  rules: LenientCreditPreferenceRule[];

  constructor(rules: LenientCreditPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCreditPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCreditPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCreditPreference[]): Map<string, string[]> {
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

export function defaultLenientCreditPreferenceValidator(): LenientCreditPreferenceValidator {
  return new LenientCreditPreferenceValidator(
    [
      new LenientCreditPreferenceRequiredContactEmailRule("lenient credit preference needs this field"),
      new LenientCreditPreferenceSummaryLengthRule(3600),
      new LenientCreditPreferenceCodeLengthRule(86400),
      new LenientCreditPreferenceFrequencyCapRangeRule(120, 120),
      new LenientCreditPreferenceRequiredTitleRule("lenient credit preference needs an entry"),
    ],
  );
}
