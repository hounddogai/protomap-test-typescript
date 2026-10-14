import * as text from "../../../../kit/text.js";
import { DefaultPaywallMetric } from "./default-paywall-metric.js";

/** A rule a default paywall metric must pass. Check returns its problems, or none. */
export interface DefaultPaywallMetricRule {
  check(item: DefaultPaywallMetric): string[];
}

export class DefaultPaywallMetricAllowedCodeRule implements DefaultPaywallMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPaywallMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class DefaultPaywallMetricExpiresAtRangeRule implements DefaultPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPaywallMetric): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPaywallMetricCodePrefixRule implements DefaultPaywallMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPaywallMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPaywallMetricRevisionRangeRule implements DefaultPaywallMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPaywallMetric): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPaywallMetricTitleLengthRule implements DefaultPaywallMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPaywallMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPaywallMetricRequiredCodeRule implements DefaultPaywallMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default paywall metric. */
export class DefaultPaywallMetricValidator {
  rules: DefaultPaywallMetricRule[];

  constructor(rules: DefaultPaywallMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPaywallMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPaywallMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPaywallMetric[]): Map<string, string[]> {
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

export function defaultDefaultPaywallMetricValidator(): DefaultPaywallMetricValidator {
  return new DefaultPaywallMetricValidator(
    [
      new DefaultPaywallMetricAllowedCodeRule(["global"]),
      new DefaultPaywallMetricExpiresAtRangeRule(80, 1000),
      new DefaultPaywallMetricCodePrefixRule("REF"),
      new DefaultPaywallMetricRevisionRangeRule(255, 86400),
      new DefaultPaywallMetricTitleLengthRule(86400),
      new DefaultPaywallMetricRequiredCodeRule("default paywall metric needs this field"),
    ],
  );
}
