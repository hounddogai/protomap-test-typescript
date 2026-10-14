import { LenientWindowProfile } from "./lenient-window-profile.js";

/** A rule a lenient window profile must pass. Check returns its problems, or none. */
export interface LenientWindowProfileRule {
  check(item: LenientWindowProfile): string[];
}

export class LenientWindowProfilePriorityRangeRule implements LenientWindowProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWindowProfile): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWindowProfileRatioRangeRule implements LenientWindowProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWindowProfile): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientWindowProfileUtmSourceLengthRule implements LenientWindowProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWindowProfile): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWindowProfileCodeLengthRule implements LenientWindowProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWindowProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWindowProfileRequiredCodeRule implements LenientWindowProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWindowProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient window profile. */
export class LenientWindowProfileValidator {
  rules: LenientWindowProfileRule[];

  constructor(rules: LenientWindowProfileRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWindowProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWindowProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWindowProfile[]): Map<string, string[]> {
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

export function defaultLenientWindowProfileValidator(): LenientWindowProfileValidator {
  return new LenientWindowProfileValidator(
    [
      new LenientWindowProfilePriorityRangeRule(32, 120),
      new LenientWindowProfileRatioRangeRule(1.7, 2472.5),
      new LenientWindowProfileUtmSourceLengthRule(16),
      new LenientWindowProfileCodeLengthRule(255),
      new LenientWindowProfileRequiredCodeRule("lenient window profile needs an entry"),
    ],
  );
}
