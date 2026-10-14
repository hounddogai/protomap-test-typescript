import { WeightedPlacementEstimate } from "./weighted-placement-estimate.js";

/** A rule a weighted placement estimate must pass. Check returns its problems, or none. */
export interface WeightedPlacementEstimateRule {
  check(item: WeightedPlacementEstimate): string[];
}

export class WeightedPlacementEstimateRequiredTitleRule implements WeightedPlacementEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementEstimateCodeLengthRule implements WeightedPlacementEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPlacementEstimateMinimumRangeRule implements WeightedPlacementEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPlacementEstimate): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPlacementEstimateRequiredCodeRule implements WeightedPlacementEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted placement estimate. */
export class WeightedPlacementEstimateValidator {
  rules: WeightedPlacementEstimateRule[];

  constructor(rules: WeightedPlacementEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementEstimate[]): Map<string, string[]> {
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

export function defaultWeightedPlacementEstimateValidator(): WeightedPlacementEstimateValidator {
  return new WeightedPlacementEstimateValidator(
    [
      new WeightedPlacementEstimateRequiredTitleRule("weighted placement estimate needs an entry"),
      new WeightedPlacementEstimateCodeLengthRule(64),
      new WeightedPlacementEstimateMinimumRangeRule(8, 1713.4),
      new WeightedPlacementEstimateRequiredCodeRule("weighted placement estimate needs this field"),
    ],
  );
}
