import { SuppressionWindow } from "./suppression-window.js";

/** A rule a suppression window must pass. Check returns its problems, or none. */
export interface SuppressionWindowRule {
  check(item: SuppressionWindow): string[];
}

export class SuppressionWindowRequiredLocaleRule implements SuppressionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionWindow): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionWindowRequiredCodeRule implements SuppressionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionWindowCodeLengthRule implements SuppressionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionWindowWeightRangeRule implements SuppressionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionWindow): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a suppression window. */
export class SuppressionWindowValidator {
  rules: SuppressionWindowRule[];

  constructor(rules: SuppressionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionWindow[]): Map<string, string[]> {
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

export function defaultSuppressionWindowValidator(): SuppressionWindowValidator {
  return new SuppressionWindowValidator(
    [
      new SuppressionWindowRequiredLocaleRule("suppression window needs a value"),
      new SuppressionWindowRequiredCodeRule("suppression window needs an entry"),
      new SuppressionWindowCodeLengthRule(32),
      new SuppressionWindowWeightRangeRule(6.8, 60.9),
    ],
  );
}
