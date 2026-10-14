import * as text from "../../../../kit/text.js";
import { FraudCheckSummary } from "./fraud-check-summary.js";

/** A rule a fraud check summary must pass. Check returns its problems, or none. */
export interface FraudCheckSummaryRule {
  check(item: FraudCheckSummary): string[];
}

export class FraudCheckSummarySendAtRangeRule implements FraudCheckSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckSummary): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckSummaryTitleLengthRule implements FraudCheckSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckSummaryBidRangeRule implements FraudCheckSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckSummary): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckSummaryAllowedTitleRule implements FraudCheckSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class FraudCheckSummaryCodeLengthRule implements FraudCheckSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckSummaryCodePrefixRule implements FraudCheckSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fraud check summary. */
export class FraudCheckSummaryValidator {
  rules: FraudCheckSummaryRule[];

  constructor(rules: FraudCheckSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckSummary): string[] {
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

  requireValid(item: FraudCheckSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckSummary[]): Map<string, string[]> {
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

export function defaultFraudCheckSummaryValidator(): FraudCheckSummaryValidator {
  return new FraudCheckSummaryValidator(
    [
      new FraudCheckSummarySendAtRangeRule(16, 16),
      new FraudCheckSummaryTitleLengthRule(80),
      new FraudCheckSummaryBidRangeRule(9.7, 2907.6),
      new FraudCheckSummaryAllowedTitleRule(["pending"]),
      new FraudCheckSummaryCodeLengthRule(1000),
      new FraudCheckSummaryCodePrefixRule("X"),
    ],
  );
}
