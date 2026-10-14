import { ManualComplaintMetric } from "./manual-complaint-metric.js";

/** A rule a manual complaint metric must pass. Check returns its problems, or none. */
export interface ManualComplaintMetricRule {
  check(item: ManualComplaintMetric): string[];
}

export class ManualComplaintMetricCodePrefixRule implements ManualComplaintMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualComplaintMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualComplaintMetricTitleLengthRule implements ManualComplaintMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualComplaintMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualComplaintMetricRequiredTitleRule implements ManualComplaintMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualComplaintMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualComplaintMetricRequiredUtmSourceRule implements ManualComplaintMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualComplaintMetric): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ManualComplaintMetricPriorityRangeRule implements ManualComplaintMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualComplaintMetric): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualComplaintMetricPinnedGuardRule implements ManualComplaintMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualComplaintMetric): string[] {
    if (item.pinned && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a manual complaint metric. */
export class ManualComplaintMetricValidator {
  rules: ManualComplaintMetricRule[];

  constructor(rules: ManualComplaintMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ManualComplaintMetric): string[] {
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

  requireValid(item: ManualComplaintMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualComplaintMetric[]): Map<string, string[]> {
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

export function defaultManualComplaintMetricValidator(): ManualComplaintMetricValidator {
  return new ManualComplaintMetricValidator(
    [
      new ManualComplaintMetricCodePrefixRule("REF"),
      new ManualComplaintMetricTitleLengthRule(120),
      new ManualComplaintMetricRequiredTitleRule("manual complaint metric needs this field"),
      new ManualComplaintMetricRequiredUtmSourceRule("manual complaint metric needs this field"),
      new ManualComplaintMetricPriorityRangeRule(120, 3600),
      new ManualComplaintMetricPinnedGuardRule(80),
    ],
  );
}
