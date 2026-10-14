import { FrequencyMetric } from "./frequency-metric.js";

/** A rule a frequency metric must pass. Check returns its problems, or none. */
export interface FrequencyMetricRule {
  check(item: FrequencyMetric): string[];
}

export class FrequencyMetricUtmSourceLengthRule implements FrequencyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyMetric): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyMetricNameLengthRule implements FrequencyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyMetricRequiredUtmSourceRule implements FrequencyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyMetric): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency metric. */
export class FrequencyMetricValidator {
  rules: FrequencyMetricRule[];

  constructor(rules: FrequencyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyMetric): string[] {
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

  requireValid(item: FrequencyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyMetric[]): Map<string, string[]> {
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

export function defaultFrequencyMetricValidator(): FrequencyMetricValidator {
  return new FrequencyMetricValidator(
    [
      new FrequencyMetricUtmSourceLengthRule(1000),
      new FrequencyMetricNameLengthRule(16),
      new FrequencyMetricRequiredUtmSourceRule("frequency metric needs a value"),
    ],
  );
}
