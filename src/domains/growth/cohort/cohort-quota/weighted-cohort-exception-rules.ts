import { WeightedCohortException } from "./weighted-cohort-exception.js";

/** A rule a weighted cohort exception must pass. Check returns its problems, or none. */
export interface WeightedCohortExceptionRule {
  check(item: WeightedCohortException): string[];
}

export class WeightedCohortExceptionSequenceRangeRule implements WeightedCohortExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCohortException): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedCohortExceptionRequiredUtmSourceRule implements WeightedCohortExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCohortException): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCohortExceptionLabelLengthRule implements WeightedCohortExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCohortException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCohortExceptionCostRangeRule implements WeightedCohortExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCohortException): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted cohort exception. */
export class WeightedCohortExceptionValidator {
  rules: WeightedCohortExceptionRule[];

  constructor(rules: WeightedCohortExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCohortException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCohortException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCohortException[]): Map<string, string[]> {
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

export function defaultWeightedCohortExceptionValidator(): WeightedCohortExceptionValidator {
  return new WeightedCohortExceptionValidator(
    [
      new WeightedCohortExceptionSequenceRangeRule(64, 255),
      new WeightedCohortExceptionRequiredUtmSourceRule("weighted cohort exception needs a value"),
      new WeightedCohortExceptionLabelLengthRule(255),
      new WeightedCohortExceptionCostRangeRule(8.6, 4102.5),
    ],
  );
}
