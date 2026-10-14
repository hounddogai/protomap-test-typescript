import * as text from "../../../../kit/text.js";
import { LenientConversionMetric } from "./lenient-conversion-metric.js";

/** A rule a lenient conversion metric must pass. Check returns its problems, or none. */
export interface LenientConversionMetricRule {
  check(item: LenientConversionMetric): string[];
}

export class LenientConversionMetricLimitRangeRule implements LenientConversionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionMetric): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientConversionMetricRequiredCurrencyRule implements LenientConversionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientConversionMetric): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class LenientConversionMetricAllowedCurrencyRule implements LenientConversionMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientConversionMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is blocked`];
    return [];
  }
}

export class LenientConversionMetricPriorityRangeRule implements LenientConversionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionMetric): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientConversionMetricSequenceRangeRule implements LenientConversionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionMetric): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientConversionMetricWindowDaysRangeRule implements LenientConversionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionMetric): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient conversion metric. */
export class LenientConversionMetricValidator {
  rules: LenientConversionMetricRule[];

  constructor(rules: LenientConversionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientConversionMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientConversionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientConversionMetric[]): Map<string, string[]> {
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

export function defaultLenientConversionMetricValidator(): LenientConversionMetricValidator {
  return new LenientConversionMetricValidator(
    [
      new LenientConversionMetricLimitRangeRule(32, 64),
      new LenientConversionMetricRequiredCurrencyRule("lenient conversion metric needs an entry"),
      new LenientConversionMetricAllowedCurrencyRule([]),
      new LenientConversionMetricPriorityRangeRule(3600, 3600),
      new LenientConversionMetricSequenceRangeRule(3600, 3600),
      new LenientConversionMetricWindowDaysRangeRule(80, 255),
    ],
  );
}
