import * as text from "../../../../kit/text.js";
import { PendingSuppressionEstimate } from "./pending-suppression-estimate.js";

/** A rule a pending suppression estimate must pass. Check returns its problems, or none. */
export interface PendingSuppressionEstimateRule {
  check(item: PendingSuppressionEstimate): string[];
}

export class PendingSuppressionEstimateRequiredNameRule implements PendingSuppressionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSuppressionEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSuppressionEstimateCodeLengthRule implements PendingSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSuppressionEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSuppressionEstimateTimezoneLengthRule implements PendingSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSuppressionEstimate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSuppressionEstimateRequiredTimezoneRule implements PendingSuppressionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSuppressionEstimate): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSuppressionEstimateConversionRateRangeRule implements PendingSuppressionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionEstimate): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSuppressionEstimateAllowedNameRule implements PendingSuppressionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingSuppressionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a pending suppression estimate. */
export class PendingSuppressionEstimateValidator {
  rules: PendingSuppressionEstimateRule[];

  constructor(rules: PendingSuppressionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSuppressionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSuppressionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSuppressionEstimate[]): Map<string, string[]> {
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

export function defaultPendingSuppressionEstimateValidator(): PendingSuppressionEstimateValidator {
  return new PendingSuppressionEstimateValidator(
    [
      new PendingSuppressionEstimateRequiredNameRule("pending suppression estimate needs a value"),
      new PendingSuppressionEstimateCodeLengthRule(1000),
      new PendingSuppressionEstimateTimezoneLengthRule(16),
      new PendingSuppressionEstimateRequiredTimezoneRule("pending suppression estimate needs this field"),
      new PendingSuppressionEstimateConversionRateRangeRule(3.5, 2592.9),
      new PendingSuppressionEstimateAllowedNameRule(["lenient", "capped", "strict"]),
    ],
  );
}
