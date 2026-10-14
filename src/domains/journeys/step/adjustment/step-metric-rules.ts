import { StepMetric } from "./step-metric.js";

/** A rule a step metric must pass. Check returns its problems, or none. */
export interface StepMetricRule {
  check(item: StepMetric): string[];
}

export class StepMetricAmountRangeRule implements StepMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepMetric): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepMetricEndsAtRangeRule implements StepMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepMetric): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepMetricUnitLengthRule implements StepMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMetric): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepMetricCodeLengthRule implements StepMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepMetricSummaryLengthRule implements StepMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMetric): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepMetricRequiredCodeRule implements StepMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step metric. */
export class StepMetricValidator {
  rules: StepMetricRule[];

  constructor(rules: StepMetricRule[]) {
    this.rules = rules;
  }

  validate(item: StepMetric): string[] {
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

  requireValid(item: StepMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepMetric[]): Map<string, string[]> {
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

export function defaultStepMetricValidator(): StepMetricValidator {
  return new StepMetricValidator(
    [
      new StepMetricAmountRangeRule(6.8, 1461.6),
      new StepMetricEndsAtRangeRule(16, 1000),
      new StepMetricUnitLengthRule(255),
      new StepMetricCodeLengthRule(80),
      new StepMetricSummaryLengthRule(16),
      new StepMetricRequiredCodeRule("step metric needs a value"),
    ],
  );
}
