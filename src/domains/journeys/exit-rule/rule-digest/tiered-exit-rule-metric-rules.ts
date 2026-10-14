import { TieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

/** A rule a tiered exit rule metric must pass. Check returns its problems, or none. */
export interface TieredExitRuleMetricRule {
  check(item: TieredExitRuleMetric): string[];
}

export class TieredExitRuleMetricRequiredTitleRule implements TieredExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredExitRuleMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredExitRuleMetricCodeLengthRule implements TieredExitRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredExitRuleMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredExitRuleMetricCodePrefixRule implements TieredExitRuleMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredExitRuleMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredExitRuleMetricRetriesRangeRule implements TieredExitRuleMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredExitRuleMetric): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredExitRuleMetricRequiredCodeRule implements TieredExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredExitRuleMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered exit rule metric. */
export class TieredExitRuleMetricValidator {
  rules: TieredExitRuleMetricRule[];

  constructor(rules: TieredExitRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: TieredExitRuleMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredExitRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredExitRuleMetric[]): Map<string, string[]> {
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

export function defaultTieredExitRuleMetricValidator(): TieredExitRuleMetricValidator {
  return new TieredExitRuleMetricValidator(
    [
      new TieredExitRuleMetricRequiredTitleRule("tiered exit rule metric needs a value"),
      new TieredExitRuleMetricCodeLengthRule(255),
      new TieredExitRuleMetricCodePrefixRule("ACM"),
      new TieredExitRuleMetricRetriesRangeRule(32, 1000),
      new TieredExitRuleMetricRequiredCodeRule("tiered exit rule metric needs this field"),
    ],
  );
}
