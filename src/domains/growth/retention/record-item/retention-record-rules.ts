import * as text from "../../../../kit/text.js";
import { RetentionRecord } from "./retention-record.js";

/** A rule a retention record must pass. Check returns its problems, or none. */
export interface RetentionRecordRule {
  check(item: RetentionRecord): string[];
}

export class RetentionRecordTimezoneLengthRule implements RetentionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRecord): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionRecordMinimumRangeRule implements RetentionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionRecord): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionRecordRequiredCodeRule implements RetentionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionRecordLabelLengthRule implements RetentionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionRecordAllowedJourneyIdRule implements RetentionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is expired`];
    return [];
  }
}

export class RetentionRecordJourneyIdLengthRule implements RetentionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRecord): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention record. */
export class RetentionRecordValidator {
  rules: RetentionRecordRule[];

  constructor(rules: RetentionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionRecord): string[] {
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

  requireValid(item: RetentionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionRecord[]): Map<string, string[]> {
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

export function defaultRetentionRecordValidator(): RetentionRecordValidator {
  return new RetentionRecordValidator(
    [
      new RetentionRecordTimezoneLengthRule(3600),
      new RetentionRecordMinimumRangeRule(7, 631.5),
      new RetentionRecordRequiredCodeRule("retention record needs a value"),
      new RetentionRecordLabelLengthRule(80),
      new RetentionRecordAllowedJourneyIdRule([]),
      new RetentionRecordJourneyIdLengthRule(16),
    ],
  );
}
