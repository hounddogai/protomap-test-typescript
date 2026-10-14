import { FraudCheckMetric } from "./fraud-check-metric.js";

/** A rule a fraud check metric must pass. Check returns its problems, or none. */
export interface FraudCheckMetricRule {
  check(item: FraudCheckMetric): string[];
}

export class FraudCheckMetricLabelLengthRule implements FraudCheckMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckMetricCodePrefixRule implements FraudCheckMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckMetricNameLengthRule implements FraudCheckMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckMetricCountryLengthRule implements FraudCheckMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckMetric): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check metric. */
export class FraudCheckMetricValidator {
  rules: FraudCheckMetricRule[];

  constructor(rules: FraudCheckMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckMetric): string[] {
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

  requireValid(item: FraudCheckMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckMetric[]): Map<string, string[]> {
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

export function defaultFraudCheckMetricValidator(): FraudCheckMetricValidator {
  return new FraudCheckMetricValidator(
    [
      new FraudCheckMetricLabelLengthRule(255),
      new FraudCheckMetricCodePrefixRule("ACM"),
      new FraudCheckMetricNameLengthRule(3600),
      new FraudCheckMetricCountryLengthRule(3600),
    ],
  );
}
