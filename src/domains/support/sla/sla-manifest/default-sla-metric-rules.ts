import * as text from "../../../../kit/text.js";
import { DefaultSlaMetric } from "./default-sla-metric.js";

/** A rule a default sla metric must pass. Check returns its problems, or none. */
export interface DefaultSlaMetricRule {
  check(item: DefaultSlaMetric): string[];
}

export class DefaultSlaMetricRequiredCurrencyRule implements DefaultSlaMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSlaMetric): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSlaMetricAllowedCodeRule implements DefaultSlaMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultSlaMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class DefaultSlaMetricVariantLengthRule implements DefaultSlaMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSlaMetric): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSlaMetricCurrencyLengthRule implements DefaultSlaMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSlaMetric): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSlaMetricRequiredCodeRule implements DefaultSlaMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSlaMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSlaMetricFloorValueRangeRule implements DefaultSlaMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSlaMetric): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default sla metric. */
export class DefaultSlaMetricValidator {
  rules: DefaultSlaMetricRule[];

  constructor(rules: DefaultSlaMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSlaMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultSlaMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSlaMetric[]): Map<string, string[]> {
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

export function defaultDefaultSlaMetricValidator(): DefaultSlaMetricValidator {
  return new DefaultSlaMetricValidator(
    [
      new DefaultSlaMetricRequiredCurrencyRule("default sla metric needs this field"),
      new DefaultSlaMetricAllowedCodeRule(["lenient", "primary", "adaptive"]),
      new DefaultSlaMetricVariantLengthRule(1000),
      new DefaultSlaMetricCurrencyLengthRule(32),
      new DefaultSlaMetricRequiredCodeRule("default sla metric needs an entry"),
      new DefaultSlaMetricFloorValueRangeRule(0.8, 3145.9),
    ],
  );
}
