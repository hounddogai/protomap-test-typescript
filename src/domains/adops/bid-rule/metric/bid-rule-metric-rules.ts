import { BidRuleMetric } from "./bid-rule-metric.js";

/** A rule a bid rule metric must pass. Check returns its problems, or none. */
export interface BidRuleMetricRule {
  check(item: BidRuleMetric): string[];
}

export class BidRuleMetricCodePrefixRule implements BidRuleMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleMetricQuantityRangeRule implements BidRuleMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleMetric): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleMetricChecksumLengthRule implements BidRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleMetric): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule metric. */
export class BidRuleMetricValidator {
  rules: BidRuleMetricRule[];

  constructor(rules: BidRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleMetric[]): Map<string, string[]> {
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

export function defaultBidRuleMetricValidator(): BidRuleMetricValidator {
  return new BidRuleMetricValidator(
    [
      new BidRuleMetricCodePrefixRule("OPS"),
      new BidRuleMetricQuantityRangeRule(80, 80),
      new BidRuleMetricChecksumLengthRule(120),
    ],
  );
}
