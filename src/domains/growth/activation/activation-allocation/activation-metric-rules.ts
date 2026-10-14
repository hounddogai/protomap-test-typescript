import { ActivationMetric } from "./activation-metric.js";

/** A rule a activation metric must pass. Check returns its problems, or none. */
export interface ActivationMetricRule {
  check(item: ActivationMetric): string[];
}

export class ActivationMetricCurrencyLengthRule implements ActivationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationMetric): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationMetricCodePrefixRule implements ActivationMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationMetricRatioRangeRule implements ActivationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationMetric): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationMetricCodeLengthRule implements ActivationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation metric. */
export class ActivationMetricValidator {
  rules: ActivationMetricRule[];

  constructor(rules: ActivationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationMetric): string[] {
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

  requireValid(item: ActivationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationMetric[]): Map<string, string[]> {
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

export function defaultActivationMetricValidator(): ActivationMetricValidator {
  return new ActivationMetricValidator(
    [
      new ActivationMetricCurrencyLengthRule(80),
      new ActivationMetricCodePrefixRule("REF"),
      new ActivationMetricRatioRangeRule(3.1, 4176.8),
      new ActivationMetricCodeLengthRule(255),
    ],
  );
}
