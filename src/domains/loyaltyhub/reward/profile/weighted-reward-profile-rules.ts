import { WeightedRewardProfile } from "./weighted-reward-profile.js";

/** A rule a weighted reward profile must pass. Check returns its problems, or none. */
export interface WeightedRewardProfileRule {
  check(item: WeightedRewardProfile): string[];
}

export class WeightedRewardProfileCodeLengthRule implements WeightedRewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardProfileRequiredCodeRule implements WeightedRewardProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardProfileThresholdRangeRule implements WeightedRewardProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardProfile): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted reward profile. */
export class WeightedRewardProfileValidator {
  rules: WeightedRewardProfileRule[];

  constructor(rules: WeightedRewardProfileRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRewardProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardProfile[]): Map<string, string[]> {
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

export function defaultWeightedRewardProfileValidator(): WeightedRewardProfileValidator {
  return new WeightedRewardProfileValidator(
    [
      new WeightedRewardProfileCodeLengthRule(86400),
      new WeightedRewardProfileRequiredCodeRule("weighted reward profile needs an entry"),
      new WeightedRewardProfileThresholdRangeRule(2.4, 1818.6),
    ],
  );
}
