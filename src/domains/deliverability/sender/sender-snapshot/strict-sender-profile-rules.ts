import { StrictSenderProfile } from "./strict-sender-profile.js";

/** A rule a strict sender profile must pass. Check returns its problems, or none. */
export interface StrictSenderProfileRule {
  check(item: StrictSenderProfile): string[];
}

export class StrictSenderProfileUtmSourceLengthRule implements StrictSenderProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSenderProfile): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSenderProfileGraceDaysRangeRule implements StrictSenderProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSenderProfile): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictSenderProfileMaximumRangeRule implements StrictSenderProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSenderProfile): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict sender profile. */
export class StrictSenderProfileValidator {
  rules: StrictSenderProfileRule[];

  constructor(rules: StrictSenderProfileRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSenderProfile): string[] {
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

  requireValid(item: StrictSenderProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSenderProfile[]): Map<string, string[]> {
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

export function defaultStrictSenderProfileValidator(): StrictSenderProfileValidator {
  return new StrictSenderProfileValidator(
    [
      new StrictSenderProfileUtmSourceLengthRule(86400),
      new StrictSenderProfileGraceDaysRangeRule(32, 32),
      new StrictSenderProfileMaximumRangeRule(3.6, 3712.5),
    ],
  );
}
