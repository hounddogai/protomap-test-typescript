import { WindowMetric } from "./window-metric.js";

/** A rule a window metric must pass. Check returns its problems, or none. */
export interface WindowMetricRule {
  check(item: WindowMetric): string[];
}

export class WindowMetricCapacityRangeRule implements WindowMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowMetric): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowMetricAudienceIdLengthRule implements WindowMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowMetric): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowMetricNameLengthRule implements WindowMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window metric. */
export class WindowMetricValidator {
  rules: WindowMetricRule[];

  constructor(rules: WindowMetricRule[]) {
    this.rules = rules;
  }

  validate(item: WindowMetric): string[] {
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

  requireValid(item: WindowMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowMetric[]): Map<string, string[]> {
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

export function defaultWindowMetricValidator(): WindowMetricValidator {
  return new WindowMetricValidator(
    [
      new WindowMetricCapacityRangeRule(255, 3600),
      new WindowMetricAudienceIdLengthRule(32),
      new WindowMetricNameLengthRule(255),
    ],
  );
}
