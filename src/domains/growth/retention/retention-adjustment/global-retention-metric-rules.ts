import { GlobalRetentionMetric } from "./global-retention-metric.js";

/** A rule a global retention metric must pass. Check returns its problems, or none. */
export interface GlobalRetentionMetricRule {
  check(item: GlobalRetentionMetric): string[];
}

export class GlobalRetentionMetricRequiredContactEmailRule implements GlobalRetentionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionMetric): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionMetricBudgetRangeRule implements GlobalRetentionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionMetric): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRetentionMetricFrequencyCapRangeRule implements GlobalRetentionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionMetric): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global retention metric. */
export class GlobalRetentionMetricValidator {
  rules: GlobalRetentionMetricRule[];

  constructor(rules: GlobalRetentionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionMetric): string[] {
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

  requireValid(item: GlobalRetentionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionMetric[]): Map<string, string[]> {
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

export function defaultGlobalRetentionMetricValidator(): GlobalRetentionMetricValidator {
  return new GlobalRetentionMetricValidator(
    [
      new GlobalRetentionMetricRequiredContactEmailRule("global retention metric needs a value"),
      new GlobalRetentionMetricBudgetRangeRule(4.1, 1806.1),
      new GlobalRetentionMetricFrequencyCapRangeRule(86400, 86400),
    ],
  );
}
