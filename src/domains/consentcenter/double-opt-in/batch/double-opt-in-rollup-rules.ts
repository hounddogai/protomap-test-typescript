import { DoubleOptInRollup } from "./double-opt-in-rollup.js";

/** A rule a double opt in rollup must pass. Check returns its problems, or none. */
export interface DoubleOptInRollupRule {
  check(item: DoubleOptInRollup): string[];
}

export class DoubleOptInRollupRequiredLabelRule implements DoubleOptInRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInRollupDiscountRangeRule implements DoubleOptInRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInRollup): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInRollupLabelLengthRule implements DoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in rollup. */
export class DoubleOptInRollupValidator {
  rules: DoubleOptInRollupRule[];

  constructor(rules: DoubleOptInRollupRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInRollup): string[] {
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

  requireValid(item: DoubleOptInRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInRollup[]): Map<string, string[]> {
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

export function defaultDoubleOptInRollupValidator(): DoubleOptInRollupValidator {
  return new DoubleOptInRollupValidator(
    [
      new DoubleOptInRollupRequiredLabelRule("double opt in rollup needs this field"),
      new DoubleOptInRollupDiscountRangeRule(3.9, 2607.8),
      new DoubleOptInRollupLabelLengthRule(32),
    ],
  );
}
