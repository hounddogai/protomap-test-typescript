import { ReputationMetric } from "./reputation-metric.js";

/** A rule a reputation metric must pass. Check returns its problems, or none. */
export interface ReputationMetricRule {
  check(item: ReputationMetric): string[];
}

export class ReputationMetricRequiredLabelRule implements ReputationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationMetricDescriptionLengthRule implements ReputationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationMetric): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationMetricActiveGuardRule implements ReputationMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReputationMetric): string[] {
    if (item.active && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ReputationMetricUpdatedAtRangeRule implements ReputationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationMetric): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationMetricLabelLengthRule implements ReputationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationMetricRequiredCohortRule implements ReputationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationMetric): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation metric. */
export class ReputationMetricValidator {
  rules: ReputationMetricRule[];

  constructor(rules: ReputationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationMetric): string[] {
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

  requireValid(item: ReputationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationMetric[]): Map<string, string[]> {
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

export function defaultReputationMetricValidator(): ReputationMetricValidator {
  return new ReputationMetricValidator(
    [
      new ReputationMetricRequiredLabelRule("reputation metric needs a value"),
      new ReputationMetricDescriptionLengthRule(3600),
      new ReputationMetricActiveGuardRule(6.6),
      new ReputationMetricUpdatedAtRangeRule(80, 86400),
      new ReputationMetricLabelLengthRule(64),
      new ReputationMetricRequiredCohortRule("reputation metric needs a value"),
    ],
  );
}
