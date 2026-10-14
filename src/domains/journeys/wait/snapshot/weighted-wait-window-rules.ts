import { WeightedWaitWindow } from "./weighted-wait-window.js";

/** A rule a weighted wait window must pass. Check returns its problems, or none. */
export interface WeightedWaitWindowRule {
  check(item: WeightedWaitWindow): string[];
}

export class WeightedWaitWindowCostRangeRule implements WeightedWaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWaitWindow): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWaitWindowCodeLengthRule implements WeightedWaitWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWaitWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWaitWindowOpenRateRangeRule implements WeightedWaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWaitWindow): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted wait window. */
export class WeightedWaitWindowValidator {
  rules: WeightedWaitWindowRule[];

  constructor(rules: WeightedWaitWindowRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWaitWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWaitWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWaitWindow[]): Map<string, string[]> {
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

export function defaultWeightedWaitWindowValidator(): WeightedWaitWindowValidator {
  return new WeightedWaitWindowValidator(
    [
      new WeightedWaitWindowCostRangeRule(6, 4786.4),
      new WeightedWaitWindowCodeLengthRule(3600),
      new WeightedWaitWindowOpenRateRangeRule(8.5, 2356.7),
    ],
  );
}
