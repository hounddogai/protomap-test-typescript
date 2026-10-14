import { BatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

/** A rule a batched exit rule metric must pass. Check returns its problems, or none. */
export interface BatchedExitRuleMetricRule {
  check(item: BatchedExitRuleMetric): string[];
}

export class BatchedExitRuleMetricLocaleLengthRule implements BatchedExitRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleMetric): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedExitRuleMetricRequiredLocaleRule implements BatchedExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleMetric): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleMetricRequiredTitleRule implements BatchedExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleMetricRatioRangeRule implements BatchedExitRuleMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedExitRuleMetric): string[] {
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

export class BatchedExitRuleMetricRequiredCodeRule implements BatchedExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched exit rule metric. */
export class BatchedExitRuleMetricValidator {
  rules: BatchedExitRuleMetricRule[];

  constructor(rules: BatchedExitRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedExitRuleMetric): string[] {
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

  requireValid(item: BatchedExitRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedExitRuleMetric[]): Map<string, string[]> {
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

export function defaultBatchedExitRuleMetricValidator(): BatchedExitRuleMetricValidator {
  return new BatchedExitRuleMetricValidator(
    [
      new BatchedExitRuleMetricLocaleLengthRule(64),
      new BatchedExitRuleMetricRequiredLocaleRule("batched exit rule metric needs an entry"),
      new BatchedExitRuleMetricRequiredTitleRule("batched exit rule metric needs an entry"),
      new BatchedExitRuleMetricRatioRangeRule(0.4, 84.2),
      new BatchedExitRuleMetricRequiredCodeRule("batched exit rule metric needs this field"),
    ],
  );
}
