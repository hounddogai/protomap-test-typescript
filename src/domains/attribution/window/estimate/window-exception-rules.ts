import { WindowException } from "./window-exception.js";

/** A rule a window exception must pass. Check returns its problems, or none. */
export interface WindowExceptionRule {
  check(item: WindowException): string[];
}

export class WindowExceptionStartsAtRangeRule implements WindowExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowException): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowExceptionLocaleLengthRule implements WindowExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowException): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowExceptionMinimumRangeRule implements WindowExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowException): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowExceptionRequiredCodeRule implements WindowExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowExceptionRequiredOwnerIdRule implements WindowExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowException): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window exception. */
export class WindowExceptionValidator {
  rules: WindowExceptionRule[];

  constructor(rules: WindowExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WindowException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowException[]): Map<string, string[]> {
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

export function defaultWindowExceptionValidator(): WindowExceptionValidator {
  return new WindowExceptionValidator(
    [
      new WindowExceptionStartsAtRangeRule(80, 120),
      new WindowExceptionLocaleLengthRule(64),
      new WindowExceptionMinimumRangeRule(7.9, 4211.8),
      new WindowExceptionRequiredCodeRule("window exception needs a value"),
      new WindowExceptionRequiredOwnerIdRule("window exception needs this field"),
    ],
  );
}
