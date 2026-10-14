import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

/** A rule a global fraud check summary must pass. Check returns its problems, or none. */
export interface GlobalFraudCheckSummaryRule {
  check(item: GlobalFraudCheckSummary): string[];
}

export class GlobalFraudCheckSummaryAllowedChecksumRule implements GlobalFraudCheckSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFraudCheckSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is too long`];
    return [];
  }
}

export class GlobalFraudCheckSummaryGraceDaysRangeRule implements GlobalFraudCheckSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFraudCheckSummary): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFraudCheckSummaryAttemptsRangeRule implements GlobalFraudCheckSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFraudCheckSummary): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFraudCheckSummaryJourneyIdLengthRule implements GlobalFraudCheckSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFraudCheckSummary): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFraudCheckSummaryRequiredCodeRule implements GlobalFraudCheckSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFraudCheckSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFraudCheckSummaryRequiredChecksumRule implements GlobalFraudCheckSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFraudCheckSummary): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global fraud check summary. */
export class GlobalFraudCheckSummaryValidator {
  rules: GlobalFraudCheckSummaryRule[];

  constructor(rules: GlobalFraudCheckSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFraudCheckSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFraudCheckSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFraudCheckSummary[]): Map<string, string[]> {
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

export function defaultGlobalFraudCheckSummaryValidator(): GlobalFraudCheckSummaryValidator {
  return new GlobalFraudCheckSummaryValidator(
    [
      new GlobalFraudCheckSummaryAllowedChecksumRule(["default", "default", "scheduled"]),
      new GlobalFraudCheckSummaryGraceDaysRangeRule(80, 120),
      new GlobalFraudCheckSummaryAttemptsRangeRule(80, 120),
      new GlobalFraudCheckSummaryJourneyIdLengthRule(120),
      new GlobalFraudCheckSummaryRequiredCodeRule("global fraud check summary needs a value"),
      new GlobalFraudCheckSummaryRequiredChecksumRule("global fraud check summary needs a value"),
    ],
  );
}
