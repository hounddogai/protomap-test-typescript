import { StrictWaitMetric } from "./strict-wait-metric.js";

/** A rule a strict wait metric must pass. Check returns its problems, or none. */
export interface StrictWaitMetricRule {
  check(item: StrictWaitMetric): string[];
}

export class StrictWaitMetricRequiredSegmentRule implements StrictWaitMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitMetric): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWaitMetricRequiredCodeRule implements StrictWaitMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWaitMetricCodeLengthRule implements StrictWaitMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWaitMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict wait metric. */
export class StrictWaitMetricValidator {
  rules: StrictWaitMetricRule[];

  constructor(rules: StrictWaitMetricRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWaitMetric): string[] {
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

  requireValid(item: StrictWaitMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWaitMetric[]): Map<string, string[]> {
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

export function defaultStrictWaitMetricValidator(): StrictWaitMetricValidator {
  return new StrictWaitMetricValidator(
    [
      new StrictWaitMetricRequiredSegmentRule("strict wait metric needs a value"),
      new StrictWaitMetricRequiredCodeRule("strict wait metric needs a value"),
      new StrictWaitMetricCodeLengthRule(255),
    ],
  );
}
