import * as text from "../../../../kit/text.js";
import { TieredActivationRecord } from "./tiered-activation-record.js";

/** A rule a tiered activation record must pass. Check returns its problems, or none. */
export interface TieredActivationRecordRule {
  check(item: TieredActivationRecord): string[];
}

export class TieredActivationRecordCodeLengthRule implements TieredActivationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationRecordRequiredTimezoneRule implements TieredActivationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationRecord): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationRecordSourceLengthRule implements TieredActivationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationRecord): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationRecordRequiredTitleRule implements TieredActivationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationRecordCodePrefixRule implements TieredActivationRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredActivationRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredActivationRecordAllowedCohortRule implements TieredActivationRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredActivationRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is out of range`];
    return [];
  }
}

/** Runs every rule of a tiered activation record. */
export class TieredActivationRecordValidator {
  rules: TieredActivationRecordRule[];

  constructor(rules: TieredActivationRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationRecord): string[] {
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

  requireValid(item: TieredActivationRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationRecord[]): Map<string, string[]> {
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

export function defaultTieredActivationRecordValidator(): TieredActivationRecordValidator {
  return new TieredActivationRecordValidator(
    [
      new TieredActivationRecordCodeLengthRule(1000),
      new TieredActivationRecordRequiredTimezoneRule("tiered activation record needs an entry"),
      new TieredActivationRecordSourceLengthRule(86400),
      new TieredActivationRecordRequiredTitleRule("tiered activation record needs this field"),
      new TieredActivationRecordCodePrefixRule("X"),
      new TieredActivationRecordAllowedCohortRule([]),
    ],
  );
}
