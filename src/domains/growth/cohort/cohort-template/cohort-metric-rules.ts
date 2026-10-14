import * as text from "../../../../kit/text.js";
import { CohortMetric } from "./cohort-metric.js";

/** A rule a cohort metric must pass. Check returns its problems, or none. */
export interface CohortMetricRule {
  check(item: CohortMetric): string[];
}

export class CohortMetricClicksRangeRule implements CohortMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortMetric): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortMetricAllowedTitleRule implements CohortMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class CohortMetricQuantityRangeRule implements CohortMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortMetric): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortMetricOpenRateRangeRule implements CohortMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortMetric): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortMetricCodePrefixRule implements CohortMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortMetricRequiredReviewerRule implements CohortMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortMetric): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort metric. */
export class CohortMetricValidator {
  rules: CohortMetricRule[];

  constructor(rules: CohortMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CohortMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortMetric[]): Map<string, string[]> {
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

export function defaultCohortMetricValidator(): CohortMetricValidator {
  return new CohortMetricValidator(
    [
      new CohortMetricClicksRangeRule(32, 64),
      new CohortMetricAllowedTitleRule([]),
      new CohortMetricQuantityRangeRule(64, 3600),
      new CohortMetricOpenRateRangeRule(3.7, 2933.9),
      new CohortMetricCodePrefixRule("Q"),
      new CohortMetricRequiredReviewerRule("cohort metric needs a value"),
    ],
  );
}
