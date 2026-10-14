import { WeightedReputationException } from "./weighted-reputation-exception.js";

/** A rule a weighted reputation exception must pass. Check returns its problems, or none. */
export interface WeightedReputationExceptionRule {
  check(item: WeightedReputationException): string[];
}

export class WeightedReputationExceptionRequiredTimezoneRule implements WeightedReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationException): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationExceptionRatioRangeRule implements WeightedReputationExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedReputationException): string[] {
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

export class WeightedReputationExceptionRequiredCodeRule implements WeightedReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted reputation exception. */
export class WeightedReputationExceptionValidator {
  rules: WeightedReputationExceptionRule[];

  constructor(rules: WeightedReputationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReputationException): string[] {
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

  requireValid(item: WeightedReputationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReputationException[]): Map<string, string[]> {
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

export function defaultWeightedReputationExceptionValidator(): WeightedReputationExceptionValidator {
  return new WeightedReputationExceptionValidator(
    [
      new WeightedReputationExceptionRequiredTimezoneRule("weighted reputation exception needs a value"),
      new WeightedReputationExceptionRatioRangeRule(6.5, 2999.5),
      new WeightedReputationExceptionRequiredCodeRule("weighted reputation exception needs this field"),
    ],
  );
}
