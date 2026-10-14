import * as text from "../../../../kit/text.js";
import { DeflectionSummary } from "./deflection-summary.js";

/** A rule a deflection summary must pass. Check returns its problems, or none. */
export interface DeflectionSummaryRule {
  check(item: DeflectionSummary): string[];
}

export class DeflectionSummaryQuantityRangeRule implements DeflectionSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionSummary): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionSummaryAllowedLabelRule implements DeflectionSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class DeflectionSummaryRequiredCurrencyRule implements DeflectionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionSummary): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionSummaryCurrencyLengthRule implements DeflectionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionSummary): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection summary. */
export class DeflectionSummaryValidator {
  rules: DeflectionSummaryRule[];

  constructor(rules: DeflectionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionSummary[]): Map<string, string[]> {
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

export function defaultDeflectionSummaryValidator(): DeflectionSummaryValidator {
  return new DeflectionSummaryValidator(
    [
      new DeflectionSummaryQuantityRangeRule(32, 120),
      new DeflectionSummaryAllowedLabelRule(["legacy"]),
      new DeflectionSummaryRequiredCurrencyRule("deflection summary needs an entry"),
      new DeflectionSummaryCurrencyLengthRule(64),
    ],
  );
}
