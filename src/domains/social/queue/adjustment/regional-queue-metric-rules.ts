import { RegionalQueueMetric } from "./regional-queue-metric.js";

/** A rule a regional queue metric must pass. Check returns its problems, or none. */
export interface RegionalQueueMetricRule {
  check(item: RegionalQueueMetric): string[];
}

export class RegionalQueueMetricRequiredTitleRule implements RegionalQueueMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueueMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueueMetricCodeLengthRule implements RegionalQueueMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalQueueMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalQueueMetricRequiredCodeRule implements RegionalQueueMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueueMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueueMetricTitleLengthRule implements RegionalQueueMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalQueueMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional queue metric. */
export class RegionalQueueMetricValidator {
  rules: RegionalQueueMetricRule[];

  constructor(rules: RegionalQueueMetricRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalQueueMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalQueueMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalQueueMetric[]): Map<string, string[]> {
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

export function defaultRegionalQueueMetricValidator(): RegionalQueueMetricValidator {
  return new RegionalQueueMetricValidator(
    [
      new RegionalQueueMetricRequiredTitleRule("regional queue metric needs this field"),
      new RegionalQueueMetricCodeLengthRule(86400),
      new RegionalQueueMetricRequiredCodeRule("regional queue metric needs an entry"),
      new RegionalQueueMetricTitleLengthRule(64),
    ],
  );
}
