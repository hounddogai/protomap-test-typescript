import * as text from "../../../../kit/text.js";
import { DefaultCsatRecord } from "./default-csat-record.js";

/** A rule a default csat record must pass. Check returns its problems, or none. */
export interface DefaultCsatRecordRule {
  check(item: DefaultCsatRecord): string[];
}

export class DefaultCsatRecordBudgetRangeRule implements DefaultCsatRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCsatRecord): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultCsatRecordExpiresAtRangeRule implements DefaultCsatRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCsatRecord): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultCsatRecordAllowedCodeRule implements DefaultCsatRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultCsatRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class DefaultCsatRecordLocaleLengthRule implements DefaultCsatRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCsatRecord): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCsatRecordCodeLengthRule implements DefaultCsatRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCsatRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCsatRecordRequiredCodeRule implements DefaultCsatRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCsatRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default csat record. */
export class DefaultCsatRecordValidator {
  rules: DefaultCsatRecordRule[];

  constructor(rules: DefaultCsatRecordRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCsatRecord): string[] {
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

  requireValid(item: DefaultCsatRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCsatRecord[]): Map<string, string[]> {
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

export function defaultDefaultCsatRecordValidator(): DefaultCsatRecordValidator {
  return new DefaultCsatRecordValidator(
    [
      new DefaultCsatRecordBudgetRangeRule(9.1, 2343.6),
      new DefaultCsatRecordExpiresAtRangeRule(16, 1000),
      new DefaultCsatRecordAllowedCodeRule(["scheduled", "strict", "regional"]),
      new DefaultCsatRecordLocaleLengthRule(86400),
      new DefaultCsatRecordCodeLengthRule(16),
      new DefaultCsatRecordRequiredCodeRule("default csat record needs a value"),
    ],
  );
}
