import { PrimaryReplyMetric } from "./primary-reply-metric.js";

/** A rule a primary reply metric must pass. Check returns its problems, or none. */
export interface PrimaryReplyMetricRule {
  check(item: PrimaryReplyMetric): string[];
}

export class PrimaryReplyMetricRequiredSummaryRule implements PrimaryReplyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryReplyMetric): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryReplyMetricCodePrefixRule implements PrimaryReplyMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryReplyMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryReplyMetricRequiredLabelRule implements PrimaryReplyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryReplyMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryReplyMetricUpdatedAtRangeRule implements PrimaryReplyMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryReplyMetric): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary reply metric. */
export class PrimaryReplyMetricValidator {
  rules: PrimaryReplyMetricRule[];

  constructor(rules: PrimaryReplyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryReplyMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryReplyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryReplyMetric[]): Map<string, string[]> {
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

export function defaultPrimaryReplyMetricValidator(): PrimaryReplyMetricValidator {
  return new PrimaryReplyMetricValidator(
    [
      new PrimaryReplyMetricRequiredSummaryRule("primary reply metric needs an entry"),
      new PrimaryReplyMetricCodePrefixRule("OPS"),
      new PrimaryReplyMetricRequiredLabelRule("primary reply metric needs a value"),
      new PrimaryReplyMetricUpdatedAtRangeRule(16, 255),
    ],
  );
}
