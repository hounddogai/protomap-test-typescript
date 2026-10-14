import { WeightedPlacementScore } from "./weighted-placement-score.js";

/** A rule a weighted placement score must pass. Check returns its problems, or none. */
export interface WeightedPlacementScoreRule {
  check(item: WeightedPlacementScore): string[];
}

export class WeightedPlacementScoreCreatedAtRangeRule implements WeightedPlacementScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPlacementScore): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPlacementScoreConversionRateRangeRule implements WeightedPlacementScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPlacementScore): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPlacementScoreRequiredDescriptionRule implements WeightedPlacementScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementScore): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted placement score. */
export class WeightedPlacementScoreValidator {
  rules: WeightedPlacementScoreRule[];

  constructor(rules: WeightedPlacementScoreRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementScore[]): Map<string, string[]> {
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

export function defaultWeightedPlacementScoreValidator(): WeightedPlacementScoreValidator {
  return new WeightedPlacementScoreValidator(
    [
      new WeightedPlacementScoreCreatedAtRangeRule(80, 86400),
      new WeightedPlacementScoreConversionRateRangeRule(9.4, 121.7),
      new WeightedPlacementScoreRequiredDescriptionRule("weighted placement score needs an entry"),
    ],
  );
}
