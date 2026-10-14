import { ActivationPreference } from "./activation-preference.js";

/** A rule a activation preference must pass. Check returns its problems, or none. */
export interface ActivationPreferenceRule {
  check(item: ActivationPreference): string[];
}

export class ActivationPreferenceEndsAtRangeRule implements ActivationPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationPreference): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationPreferenceRequiredTitleRule implements ActivationPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationPreferenceTitleLengthRule implements ActivationPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationPreferenceRequiredTimezoneRule implements ActivationPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationPreference): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationPreferenceTimezoneLengthRule implements ActivationPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationPreference): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation preference. */
export class ActivationPreferenceValidator {
  rules: ActivationPreferenceRule[];

  constructor(rules: ActivationPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationPreference[]): Map<string, string[]> {
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

export function defaultActivationPreferenceValidator(): ActivationPreferenceValidator {
  return new ActivationPreferenceValidator(
    [
      new ActivationPreferenceEndsAtRangeRule(80, 120),
      new ActivationPreferenceRequiredTitleRule("activation preference needs an entry"),
      new ActivationPreferenceTitleLengthRule(64),
      new ActivationPreferenceRequiredTimezoneRule("activation preference needs an entry"),
      new ActivationPreferenceTimezoneLengthRule(1000),
    ],
  );
}
