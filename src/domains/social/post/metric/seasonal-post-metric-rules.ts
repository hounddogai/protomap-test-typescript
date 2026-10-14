import { SeasonalPostMetric } from "./seasonal-post-metric.js";

/** A rule a seasonal post metric must pass. Check returns its problems, or none. */
export interface SeasonalPostMetricRule {
  check(item: SeasonalPostMetric): string[];
}

export class SeasonalPostMetricRequiredCohortRule implements SeasonalPostMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPostMetric): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPostMetricCohortLengthRule implements SeasonalPostMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPostMetric): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPostMetricLabelLengthRule implements SeasonalPostMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPostMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal post metric. */
export class SeasonalPostMetricValidator {
  rules: SeasonalPostMetricRule[];

  constructor(rules: SeasonalPostMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPostMetric): string[] {
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

  requireValid(item: SeasonalPostMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPostMetric[]): Map<string, string[]> {
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

export function defaultSeasonalPostMetricValidator(): SeasonalPostMetricValidator {
  return new SeasonalPostMetricValidator(
    [
      new SeasonalPostMetricRequiredCohortRule("seasonal post metric needs a value"),
      new SeasonalPostMetricCohortLengthRule(1000),
      new SeasonalPostMetricLabelLengthRule(1000),
    ],
  );
}
