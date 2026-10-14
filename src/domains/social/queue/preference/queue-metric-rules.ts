import * as text from "../../../../kit/text.js";
import { QueueMetric } from "./queue-metric.js";

/** A rule a queue metric must pass. Check returns its problems, or none. */
export interface QueueMetricRule {
  check(item: QueueMetric): string[];
}

export class QueueMetricRequiredNameRule implements QueueMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class QueueMetricAllowedTimezoneRule implements QueueMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is blocked`];
    return [];
  }
}

export class QueueMetricStartsAtRangeRule implements QueueMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueMetric): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueMetricTimezoneLengthRule implements QueueMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueMetric): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueMetricFrequencyCapRangeRule implements QueueMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueMetric): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a queue metric. */
export class QueueMetricValidator {
  rules: QueueMetricRule[];

  constructor(rules: QueueMetricRule[]) {
    this.rules = rules;
  }

  validate(item: QueueMetric): string[] {
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

  requireValid(item: QueueMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueMetric[]): Map<string, string[]> {
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

export function defaultQueueMetricValidator(): QueueMetricValidator {
  return new QueueMetricValidator(
    [
      new QueueMetricRequiredNameRule("queue metric needs an entry"),
      new QueueMetricAllowedTimezoneRule([]),
      new QueueMetricStartsAtRangeRule(64, 3600),
      new QueueMetricTimezoneLengthRule(64),
      new QueueMetricFrequencyCapRangeRule(16, 64),
    ],
  );
}
