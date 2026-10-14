import { FallbackSenderMetric } from "./fallback-sender-metric.js";

/** A rule a fallback sender metric must pass. Check returns its problems, or none. */
export interface FallbackSenderMetricRule {
  check(item: FallbackSenderMetric): string[];
}

export class FallbackSenderMetricWeightRangeRule implements FallbackSenderMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSenderMetric): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackSenderMetricRequiredLabelRule implements FallbackSenderMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSenderMetricTimezoneLengthRule implements FallbackSenderMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSenderMetric): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSenderMetricMaximumRangeRule implements FallbackSenderMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSenderMetric): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback sender metric. */
export class FallbackSenderMetricValidator {
  rules: FallbackSenderMetricRule[];

  constructor(rules: FallbackSenderMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSenderMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSenderMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSenderMetric[]): Map<string, string[]> {
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

export function defaultFallbackSenderMetricValidator(): FallbackSenderMetricValidator {
  return new FallbackSenderMetricValidator(
    [
      new FallbackSenderMetricWeightRangeRule(5.5, 4706.2),
      new FallbackSenderMetricRequiredLabelRule("fallback sender metric needs a value"),
      new FallbackSenderMetricTimezoneLengthRule(120),
      new FallbackSenderMetricMaximumRangeRule(4.3, 3262.1),
    ],
  );
}
