import * as text from "../../../../kit/text.js";
import { LenientPaywallMetric } from "./lenient-paywall-metric.js";

/** A rule a lenient paywall metric must pass. Check returns its problems, or none. */
export interface LenientPaywallMetricRule {
  check(item: LenientPaywallMetric): string[];
}

export class LenientPaywallMetricRequiredCodeRule implements LenientPaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPaywallMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPaywallMetricAllowedSummaryRule implements LenientPaywallMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPaywallMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is too long`];
    return [];
  }
}

export class LenientPaywallMetricCostRangeRule implements LenientPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPaywallMetric): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPaywallMetricCodePrefixRule implements LenientPaywallMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPaywallMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientPaywallMetricRequiredSegmentRule implements LenientPaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPaywallMetric): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient paywall metric. */
export class LenientPaywallMetricValidator {
  rules: LenientPaywallMetricRule[];

  constructor(rules: LenientPaywallMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPaywallMetric): string[] {
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

  requireValid(item: LenientPaywallMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPaywallMetric[]): Map<string, string[]> {
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

export function defaultLenientPaywallMetricValidator(): LenientPaywallMetricValidator {
  return new LenientPaywallMetricValidator(
    [
      new LenientPaywallMetricRequiredCodeRule("lenient paywall metric needs a value"),
      new LenientPaywallMetricAllowedSummaryRule(["global", "scheduled"]),
      new LenientPaywallMetricCostRangeRule(9.2, 4295.8),
      new LenientPaywallMetricCodePrefixRule("REF"),
      new LenientPaywallMetricRequiredSegmentRule("lenient paywall metric needs a value"),
    ],
  );
}
