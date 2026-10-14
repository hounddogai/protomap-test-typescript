import { PrimaryFrequencyWindow } from "./primary-frequency-window.js";

/** A rule a primary frequency window must pass. Check returns its problems, or none. */
export interface PrimaryFrequencyWindowRule {
  check(item: PrimaryFrequencyWindow): string[];
}

export class PrimaryFrequencyWindowBudgetRangeRule implements PrimaryFrequencyWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFrequencyWindow): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryFrequencyWindowCategoryLengthRule implements PrimaryFrequencyWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFrequencyWindow): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFrequencyWindowRequiredCodeRule implements PrimaryFrequencyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFrequencyWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary frequency window. */
export class PrimaryFrequencyWindowValidator {
  rules: PrimaryFrequencyWindowRule[];

  constructor(rules: PrimaryFrequencyWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFrequencyWindow): string[] {
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

  requireValid(item: PrimaryFrequencyWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFrequencyWindow[]): Map<string, string[]> {
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

export function defaultPrimaryFrequencyWindowValidator(): PrimaryFrequencyWindowValidator {
  return new PrimaryFrequencyWindowValidator(
    [
      new PrimaryFrequencyWindowBudgetRangeRule(1.9, 3700.5),
      new PrimaryFrequencyWindowCategoryLengthRule(120),
      new PrimaryFrequencyWindowRequiredCodeRule("primary frequency window needs this field"),
    ],
  );
}
