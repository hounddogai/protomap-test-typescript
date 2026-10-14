import { MacroRecord } from "./macro-record.js";

/** A rule a macro record must pass. Check returns its problems, or none. */
export interface MacroRecordRule {
  check(item: MacroRecord): string[];
}

export class MacroRecordRequiredLabelRule implements MacroRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MacroRecordCreatedAtRangeRule implements MacroRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroRecord): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroRecordSummaryLengthRule implements MacroRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroRecord): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroRecordRequiredCodeRule implements MacroRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroRecordRequiredExternalRefRule implements MacroRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroRecord): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro record. */
export class MacroRecordValidator {
  rules: MacroRecordRule[];

  constructor(rules: MacroRecordRule[]) {
    this.rules = rules;
  }

  validate(item: MacroRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroRecord[]): Map<string, string[]> {
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

export function defaultMacroRecordValidator(): MacroRecordValidator {
  return new MacroRecordValidator(
    [
      new MacroRecordRequiredLabelRule("macro record needs an entry"),
      new MacroRecordCreatedAtRangeRule(32, 80),
      new MacroRecordSummaryLengthRule(16),
      new MacroRecordRequiredCodeRule("macro record needs a value"),
      new MacroRecordRequiredExternalRefRule("macro record needs a value"),
    ],
  );
}
