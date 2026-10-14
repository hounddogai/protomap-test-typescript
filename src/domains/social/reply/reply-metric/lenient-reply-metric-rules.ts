import { LenientReplyMetric } from "./lenient-reply-metric.js";

/** A rule a lenient reply metric must pass. Check returns its problems, or none. */
export interface LenientReplyMetricRule {
  check(item: LenientReplyMetric): string[];
}

export class LenientReplyMetricNameLengthRule implements LenientReplyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReplyMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientReplyMetricJourneyIdLengthRule implements LenientReplyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReplyMetric): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientReplyMetricCapacityRangeRule implements LenientReplyMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReplyMetric): string[] {
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

/** Runs every rule of a lenient reply metric. */
export class LenientReplyMetricValidator {
  rules: LenientReplyMetricRule[];

  constructor(rules: LenientReplyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientReplyMetric): string[] {
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

  requireValid(item: LenientReplyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientReplyMetric[]): Map<string, string[]> {
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

export function defaultLenientReplyMetricValidator(): LenientReplyMetricValidator {
  return new LenientReplyMetricValidator(
    [
      new LenientReplyMetricNameLengthRule(64),
      new LenientReplyMetricJourneyIdLengthRule(16),
      new LenientReplyMetricCapacityRangeRule(16, 255),
    ],
  );
}
