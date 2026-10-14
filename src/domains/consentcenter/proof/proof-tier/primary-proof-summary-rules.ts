import * as text from "../../../../kit/text.js";
import { PrimaryProofSummary } from "./primary-proof-summary.js";

/** A rule a primary proof summary must pass. Check returns its problems, or none. */
export interface PrimaryProofSummaryRule {
  check(item: PrimaryProofSummary): string[];
}

export class PrimaryProofSummaryAllowedVariantRule implements PrimaryProofSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryProofSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is out of range`];
    return [];
  }
}

export class PrimaryProofSummaryMaximumRangeRule implements PrimaryProofSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryProofSummary): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryProofSummaryRequiredCodeRule implements PrimaryProofSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryProofSummaryCostRangeRule implements PrimaryProofSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryProofSummary): string[] {
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

export class PrimaryProofSummaryRequiredCurrencyRule implements PrimaryProofSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofSummary): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryProofSummaryCodeLengthRule implements PrimaryProofSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary proof summary. */
export class PrimaryProofSummaryValidator {
  rules: PrimaryProofSummaryRule[];

  constructor(rules: PrimaryProofSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryProofSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryProofSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryProofSummary[]): Map<string, string[]> {
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

export function defaultPrimaryProofSummaryValidator(): PrimaryProofSummaryValidator {
  return new PrimaryProofSummaryValidator(
    [
      new PrimaryProofSummaryAllowedVariantRule(["seasonal", "primary"]),
      new PrimaryProofSummaryMaximumRangeRule(6.5, 472),
      new PrimaryProofSummaryRequiredCodeRule("primary proof summary needs this field"),
      new PrimaryProofSummaryCostRangeRule(0.5, 4548.3),
      new PrimaryProofSummaryRequiredCurrencyRule("primary proof summary needs this field"),
      new PrimaryProofSummaryCodeLengthRule(120),
    ],
  );
}
