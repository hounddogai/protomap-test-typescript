import { TieredMacroRecord } from "./tiered-macro-record.js";

/** A rule a tiered macro record must pass. Check returns its problems, or none. */
export interface TieredMacroRecordRule {
  check(item: TieredMacroRecord): string[];
}

export class TieredMacroRecordCodeLengthRule implements TieredMacroRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredMacroRecordRateRangeRule implements TieredMacroRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroRecord): string[] {
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

export class TieredMacroRecordRequiredNotesRule implements TieredMacroRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMacroRecord): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMacroRecordTitleLengthRule implements TieredMacroRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredMacroRecordRequiredLabelRule implements TieredMacroRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMacroRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMacroRecordLabelLengthRule implements TieredMacroRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered macro record. */
export class TieredMacroRecordValidator {
  rules: TieredMacroRecordRule[];

  constructor(rules: TieredMacroRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMacroRecord): string[] {
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

  requireValid(item: TieredMacroRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMacroRecord[]): Map<string, string[]> {
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

export function defaultTieredMacroRecordValidator(): TieredMacroRecordValidator {
  return new TieredMacroRecordValidator(
    [
      new TieredMacroRecordCodeLengthRule(86400),
      new TieredMacroRecordRateRangeRule(5.3, 3750),
      new TieredMacroRecordRequiredNotesRule("tiered macro record needs a value"),
      new TieredMacroRecordTitleLengthRule(120),
      new TieredMacroRecordRequiredLabelRule("tiered macro record needs this field"),
      new TieredMacroRecordLabelLengthRule(32),
    ],
  );
}
