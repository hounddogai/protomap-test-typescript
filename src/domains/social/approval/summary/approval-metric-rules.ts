import { ApprovalMetric } from "./approval-metric.js";

/** A rule a approval metric must pass. Check returns its problems, or none. */
export interface ApprovalMetricRule {
  check(item: ApprovalMetric): string[];
}

export class ApprovalMetricLabelLengthRule implements ApprovalMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalMetricCodePrefixRule implements ApprovalMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalMetricRequiredTimezoneRule implements ApprovalMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalMetric): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalMetricRequiredCohortRule implements ApprovalMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalMetric): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalMetricCohortLengthRule implements ApprovalMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalMetric): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalMetricGraceDaysRangeRule implements ApprovalMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalMetric): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval metric. */
export class ApprovalMetricValidator {
  rules: ApprovalMetricRule[];

  constructor(rules: ApprovalMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalMetric[]): Map<string, string[]> {
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

export function defaultApprovalMetricValidator(): ApprovalMetricValidator {
  return new ApprovalMetricValidator(
    [
      new ApprovalMetricLabelLengthRule(64),
      new ApprovalMetricCodePrefixRule("X"),
      new ApprovalMetricRequiredTimezoneRule("approval metric needs a value"),
      new ApprovalMetricRequiredCohortRule("approval metric needs a value"),
      new ApprovalMetricCohortLengthRule(86400),
      new ApprovalMetricGraceDaysRangeRule(80, 255),
    ],
  );
}
