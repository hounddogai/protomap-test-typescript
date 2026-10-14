import * as text from "../../../../kit/text.js";
import { StrictCreditRecord } from "./strict-credit-record.js";

/** A rule a strict credit record must pass. Check returns its problems, or none. */
export interface StrictCreditRecordRule {
  check(item: StrictCreditRecord): string[];
}

export class StrictCreditRecordCodePrefixRule implements StrictCreditRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCreditRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictCreditRecordFrequencyCapRangeRule implements StrictCreditRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCreditRecord): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictCreditRecordRevisionRangeRule implements StrictCreditRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCreditRecord): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictCreditRecordCodeLengthRule implements StrictCreditRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreditRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreditRecordRequiredCodeRule implements StrictCreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreditRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreditRecordAllowedTitleRule implements StrictCreditRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictCreditRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

/** Runs every rule of a strict credit record. */
export class StrictCreditRecordValidator {
  rules: StrictCreditRecordRule[];

  constructor(rules: StrictCreditRecordRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreditRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCreditRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreditRecord[]): Map<string, string[]> {
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

export function defaultStrictCreditRecordValidator(): StrictCreditRecordValidator {
  return new StrictCreditRecordValidator(
    [
      new StrictCreditRecordCodePrefixRule("Q"),
      new StrictCreditRecordFrequencyCapRangeRule(16, 86400),
      new StrictCreditRecordRevisionRangeRule(1000, 1000),
      new StrictCreditRecordCodeLengthRule(80),
      new StrictCreditRecordRequiredCodeRule("strict credit record needs a value"),
      new StrictCreditRecordAllowedTitleRule(["pending", "strict"]),
    ],
  );
}
