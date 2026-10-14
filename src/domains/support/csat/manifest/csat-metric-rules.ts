import * as text from "../../../../kit/text.js";
import { CsatMetric } from "./csat-metric.js";

/** A rule a csat metric must pass. Check returns its problems, or none. */
export interface CsatMetricRule {
  check(item: CsatMetric): string[];
}

export class CsatMetricAllowedNameRule implements CsatMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class CsatMetricCodeLengthRule implements CsatMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatMetricRequiredCodeRule implements CsatMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatMetricCodePrefixRule implements CsatMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatMetricScoreRangeRule implements CsatMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatMetric): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatMetricQuantityRangeRule implements CsatMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatMetric): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a csat metric. */
export class CsatMetricValidator {
  rules: CsatMetricRule[];

  constructor(rules: CsatMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CsatMetric): string[] {
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

  requireValid(item: CsatMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatMetric[]): Map<string, string[]> {
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

export function defaultCsatMetricValidator(): CsatMetricValidator {
  return new CsatMetricValidator(
    [
      new CsatMetricAllowedNameRule(["adaptive", "strict"]),
      new CsatMetricCodeLengthRule(1000),
      new CsatMetricRequiredCodeRule("csat metric needs an entry"),
      new CsatMetricCodePrefixRule("ACM"),
      new CsatMetricScoreRangeRule(6.8, 1195.7),
      new CsatMetricQuantityRangeRule(16, 32),
    ],
  );
}
