import { WindowProfile } from "./window-profile.js";

/** A rule a window profile must pass. Check returns its problems, or none. */
export interface WindowProfileRule {
  check(item: WindowProfile): string[];
}

export class WindowProfileRetriesRangeRule implements WindowProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowProfile): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowProfileUtmSourceLengthRule implements WindowProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowProfile): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowProfileRequiredNameRule implements WindowProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window profile. */
export class WindowProfileValidator {
  rules: WindowProfileRule[];

  constructor(rules: WindowProfileRule[]) {
    this.rules = rules;
  }

  validate(item: WindowProfile): string[] {
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

  requireValid(item: WindowProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowProfile[]): Map<string, string[]> {
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

export function defaultWindowProfileValidator(): WindowProfileValidator {
  return new WindowProfileValidator(
    [
      new WindowProfileRetriesRangeRule(120, 255),
      new WindowProfileUtmSourceLengthRule(16),
      new WindowProfileRequiredNameRule("window profile needs a value"),
    ],
  );
}
