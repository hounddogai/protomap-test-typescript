import * as text from "../../../../kit/text.js";
import { CappedCsatMetric } from "./capped-csat-metric.js";

/** A rule a capped csat metric must pass. Check returns its problems, or none. */
export interface CappedCsatMetricRule {
  check(item: CappedCsatMetric): string[];
}

export class CappedCsatMetricRequiredCodeRule implements CappedCsatMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCsatMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCsatMetricCurrencyLengthRule implements CappedCsatMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCsatMetric): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCsatMetricWeightRangeRule implements CappedCsatMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCsatMetric): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedCsatMetricCodeLengthRule implements CappedCsatMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCsatMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCsatMetricAllowedNameRule implements CappedCsatMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedCsatMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a capped csat metric. */
export class CappedCsatMetricValidator {
  rules: CappedCsatMetricRule[];

  constructor(rules: CappedCsatMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCsatMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCsatMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCsatMetric[]): Map<string, string[]> {
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

export function defaultCappedCsatMetricValidator(): CappedCsatMetricValidator {
  return new CappedCsatMetricValidator(
    [
      new CappedCsatMetricRequiredCodeRule("capped csat metric needs a value"),
      new CappedCsatMetricCurrencyLengthRule(16),
      new CappedCsatMetricWeightRangeRule(3.7, 2982.1),
      new CappedCsatMetricCodeLengthRule(3600),
      new CappedCsatMetricAllowedNameRule(["lenient", "global"]),
    ],
  );
}
