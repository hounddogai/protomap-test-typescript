import { PendingRewardMetric } from "./pending-reward-metric.js";

/** A rule a pending reward metric must pass. Check returns its problems, or none. */
export interface PendingRewardMetricRule {
  check(item: PendingRewardMetric): string[];
}

export class PendingRewardMetricLabelLengthRule implements PendingRewardMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardMetricNameLengthRule implements PendingRewardMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardMetricCodePrefixRule implements PendingRewardMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRewardMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingRewardMetricRequiredCodeRule implements PendingRewardMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardMetricRequiredLabelRule implements PendingRewardMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending reward metric. */
export class PendingRewardMetricValidator {
  rules: PendingRewardMetricRule[];

  constructor(rules: PendingRewardMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingRewardMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardMetric[]): Map<string, string[]> {
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

export function defaultPendingRewardMetricValidator(): PendingRewardMetricValidator {
  return new PendingRewardMetricValidator(
    [
      new PendingRewardMetricLabelLengthRule(3600),
      new PendingRewardMetricNameLengthRule(1000),
      new PendingRewardMetricCodePrefixRule("OPS"),
      new PendingRewardMetricRequiredCodeRule("pending reward metric needs an entry"),
      new PendingRewardMetricRequiredLabelRule("pending reward metric needs a value"),
    ],
  );
}
