import * as text from "../../../../kit/text.js";
import { PendingSuppressionRecord } from "./pending-suppression-record.js";

/** A rule a pending suppression record must pass. Check returns its problems, or none. */
export interface PendingSuppressionRecordRule {
  check(item: PendingSuppressionRecord): string[];
}

export class PendingSuppressionRecordConversionRateRangeRule implements PendingSuppressionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionRecord): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSuppressionRecordCategoryLengthRule implements PendingSuppressionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSuppressionRecord): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSuppressionRecordRateRangeRule implements PendingSuppressionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionRecord): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingSuppressionRecordRequiredCohortRule implements PendingSuppressionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSuppressionRecord): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSuppressionRecordStartsAtRangeRule implements PendingSuppressionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionRecord): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSuppressionRecordAllowedExternalRefRule implements PendingSuppressionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingSuppressionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is expired`];
    return [];
  }
}

/** Runs every rule of a pending suppression record. */
export class PendingSuppressionRecordValidator {
  rules: PendingSuppressionRecordRule[];

  constructor(rules: PendingSuppressionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSuppressionRecord): string[] {
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

  requireValid(item: PendingSuppressionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSuppressionRecord[]): Map<string, string[]> {
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

export function defaultPendingSuppressionRecordValidator(): PendingSuppressionRecordValidator {
  return new PendingSuppressionRecordValidator(
    [
      new PendingSuppressionRecordConversionRateRangeRule(5.8, 2050.9),
      new PendingSuppressionRecordCategoryLengthRule(86400),
      new PendingSuppressionRecordRateRangeRule(7, 324.7),
      new PendingSuppressionRecordRequiredCohortRule("pending suppression record needs this field"),
      new PendingSuppressionRecordStartsAtRangeRule(32, 120),
      new PendingSuppressionRecordAllowedExternalRefRule([]),
    ],
  );
}
