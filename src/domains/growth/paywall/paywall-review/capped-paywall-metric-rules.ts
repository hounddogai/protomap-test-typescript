import { CappedPaywallMetric } from "./capped-paywall-metric.js";

/** A rule a capped paywall metric must pass. Check returns its problems, or none. */
export interface CappedPaywallMetricRule {
  check(item: CappedPaywallMetric): string[];
}

export class CappedPaywallMetricSummaryLengthRule implements CappedPaywallMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPaywallMetric): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPaywallMetricScoreRangeRule implements CappedPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPaywallMetric): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPaywallMetricBidRangeRule implements CappedPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPaywallMetric): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPaywallMetricCodePrefixRule implements CappedPaywallMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPaywallMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPaywallMetricRequiredTitleRule implements CappedPaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPaywallMetricRequiredCodeRule implements CappedPaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped paywall metric. */
export class CappedPaywallMetricValidator {
  rules: CappedPaywallMetricRule[];

  constructor(rules: CappedPaywallMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPaywallMetric): string[] {
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

  requireValid(item: CappedPaywallMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPaywallMetric[]): Map<string, string[]> {
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

export function defaultCappedPaywallMetricValidator(): CappedPaywallMetricValidator {
  return new CappedPaywallMetricValidator(
    [
      new CappedPaywallMetricSummaryLengthRule(1000),
      new CappedPaywallMetricScoreRangeRule(0.7, 268.8),
      new CappedPaywallMetricBidRangeRule(9.7, 2963),
      new CappedPaywallMetricCodePrefixRule("ACM"),
      new CappedPaywallMetricRequiredTitleRule("capped paywall metric needs an entry"),
      new CappedPaywallMetricRequiredCodeRule("capped paywall metric needs a value"),
    ],
  );
}
