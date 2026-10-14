import { LegacyPaywallMetric } from "./legacy-paywall-metric.js";

/** A rule a legacy paywall metric must pass. Check returns its problems, or none. */
export interface LegacyPaywallMetricRule {
  check(item: LegacyPaywallMetric): string[];
}

export class LegacyPaywallMetricCodePrefixRule implements LegacyPaywallMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyPaywallMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyPaywallMetricRequiredCodeRule implements LegacyPaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPaywallMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPaywallMetricLimitRangeRule implements LegacyPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPaywallMetric): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPaywallMetricOpenRateRangeRule implements LegacyPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPaywallMetric): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy paywall metric. */
export class LegacyPaywallMetricValidator {
  rules: LegacyPaywallMetricRule[];

  constructor(rules: LegacyPaywallMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPaywallMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPaywallMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPaywallMetric[]): Map<string, string[]> {
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

export function defaultLegacyPaywallMetricValidator(): LegacyPaywallMetricValidator {
  return new LegacyPaywallMetricValidator(
    [
      new LegacyPaywallMetricCodePrefixRule("OPS"),
      new LegacyPaywallMetricRequiredCodeRule("legacy paywall metric needs this field"),
      new LegacyPaywallMetricLimitRangeRule(64, 255),
      new LegacyPaywallMetricOpenRateRangeRule(3.5, 3031.8),
    ],
  );
}
