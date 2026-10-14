import { WeightedQueueEstimate } from "./weighted-queue-estimate.js";

/** A rule a weighted queue estimate must pass. Check returns its problems, or none. */
export interface WeightedQueueEstimateRule {
  check(item: WeightedQueueEstimate): string[];
}

export class WeightedQueueEstimateBudgetRangeRule implements WeightedQueueEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedQueueEstimate): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedQueueEstimateMaximumRangeRule implements WeightedQueueEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedQueueEstimate): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedQueueEstimateArchivedGuardRule implements WeightedQueueEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedQueueEstimate): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a weighted queue estimate. */
export class WeightedQueueEstimateValidator {
  rules: WeightedQueueEstimateRule[];

  constructor(rules: WeightedQueueEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedQueueEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedQueueEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedQueueEstimate[]): Map<string, string[]> {
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

export function defaultWeightedQueueEstimateValidator(): WeightedQueueEstimateValidator {
  return new WeightedQueueEstimateValidator(
    [
      new WeightedQueueEstimateBudgetRangeRule(6.1, 2831),
      new WeightedQueueEstimateMaximumRangeRule(4, 999.3),
      new WeightedQueueEstimateArchivedGuardRule(7),
    ],
  );
}
