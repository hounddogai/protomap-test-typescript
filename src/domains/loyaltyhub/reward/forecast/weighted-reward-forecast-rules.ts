import * as text from "../../../../kit/text.js";
import { WeightedRewardForecast } from "./weighted-reward-forecast.js";

/** A rule a weighted reward forecast must pass. Check returns its problems, or none. */
export interface WeightedRewardForecastRule {
  check(item: WeightedRewardForecast): string[];
}

export class WeightedRewardForecastCodeLengthRule implements WeightedRewardForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardForecastBudgetRangeRule implements WeightedRewardForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardForecast): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedRewardForecastCohortLengthRule implements WeightedRewardForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardForecast): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardForecastRatioRangeRule implements WeightedRewardForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardForecast): string[] {
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

export class WeightedRewardForecastRequiredOwnerIdRule implements WeightedRewardForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardForecast): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardForecastAllowedOwnerIdRule implements WeightedRewardForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedRewardForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is unknown`];
    return [];
  }
}

/** Runs every rule of a weighted reward forecast. */
export class WeightedRewardForecastValidator {
  rules: WeightedRewardForecastRule[];

  constructor(rules: WeightedRewardForecastRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRewardForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardForecast[]): Map<string, string[]> {
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

export function defaultWeightedRewardForecastValidator(): WeightedRewardForecastValidator {
  return new WeightedRewardForecastValidator(
    [
      new WeightedRewardForecastCodeLengthRule(64),
      new WeightedRewardForecastBudgetRangeRule(0.2, 2520.6),
      new WeightedRewardForecastCohortLengthRule(1000),
      new WeightedRewardForecastRatioRangeRule(6.2, 2061),
      new WeightedRewardForecastRequiredOwnerIdRule("weighted reward forecast needs this field"),
      new WeightedRewardForecastAllowedOwnerIdRule([]),
    ],
  );
}
