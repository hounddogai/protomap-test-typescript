import * as text from "../../../../kit/text.js";
import { TieredSubscriptionMetric } from "./tiered-subscription-metric.js";

/** A rule a tiered subscription metric must pass. Check returns its problems, or none. */
export interface TieredSubscriptionMetricRule {
  check(item: TieredSubscriptionMetric): string[];
}

export class TieredSubscriptionMetricRequiredLabelRule implements TieredSubscriptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSubscriptionMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSubscriptionMetricAllowedUtmSourceRule implements TieredSubscriptionMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredSubscriptionMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is out of range`];
    return [];
  }
}

export class TieredSubscriptionMetricExternalRefLengthRule implements TieredSubscriptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSubscriptionMetric): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSubscriptionMetricRequiredCodeRule implements TieredSubscriptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSubscriptionMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered subscription metric. */
export class TieredSubscriptionMetricValidator {
  rules: TieredSubscriptionMetricRule[];

  constructor(rules: TieredSubscriptionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSubscriptionMetric): string[] {
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

  requireValid(item: TieredSubscriptionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSubscriptionMetric[]): Map<string, string[]> {
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

export function defaultTieredSubscriptionMetricValidator(): TieredSubscriptionMetricValidator {
  return new TieredSubscriptionMetricValidator(
    [
      new TieredSubscriptionMetricRequiredLabelRule("tiered subscription metric needs an entry"),
      new TieredSubscriptionMetricAllowedUtmSourceRule([]),
      new TieredSubscriptionMetricExternalRefLengthRule(255),
      new TieredSubscriptionMetricRequiredCodeRule("tiered subscription metric needs an entry"),
    ],
  );
}
