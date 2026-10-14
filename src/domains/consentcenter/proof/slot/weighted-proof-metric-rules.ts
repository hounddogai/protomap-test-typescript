import { WeightedProofMetric } from "./weighted-proof-metric.js";

/** A rule a weighted proof metric must pass. Check returns its problems, or none. */
export interface WeightedProofMetricRule {
  check(item: WeightedProofMetric): string[];
}

export class WeightedProofMetricChannelLengthRule implements WeightedProofMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedProofMetric): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedProofMetricMinimumRangeRule implements WeightedProofMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedProofMetric): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedProofMetricBatchSizeRangeRule implements WeightedProofMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedProofMetric): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted proof metric. */
export class WeightedProofMetricValidator {
  rules: WeightedProofMetricRule[];

  constructor(rules: WeightedProofMetricRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedProofMetric): string[] {
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

  requireValid(item: WeightedProofMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedProofMetric[]): Map<string, string[]> {
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

export function defaultWeightedProofMetricValidator(): WeightedProofMetricValidator {
  return new WeightedProofMetricValidator(
    [
      new WeightedProofMetricChannelLengthRule(120),
      new WeightedProofMetricMinimumRangeRule(3, 3110.6),
      new WeightedProofMetricBatchSizeRangeRule(16, 3600),
    ],
  );
}
