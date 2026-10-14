import { LenientLevelRecord } from "./lenient-level-record.js";

/** A rule a lenient level record must pass. Check returns its problems, or none. */
export interface LenientLevelRecordRule {
  check(item: LenientLevelRecord): string[];
}

export class LenientLevelRecordRequiredNameRule implements LenientLevelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientLevelRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientLevelRecordRequiredCodeRule implements LenientLevelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientLevelRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientLevelRecordNameLengthRule implements LenientLevelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientLevelRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientLevelRecordBudgetRangeRule implements LenientLevelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLevelRecord): string[] {
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

export class LenientLevelRecordChannelLengthRule implements LenientLevelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientLevelRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient level record. */
export class LenientLevelRecordValidator {
  rules: LenientLevelRecordRule[];

  constructor(rules: LenientLevelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LenientLevelRecord): string[] {
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

  requireValid(item: LenientLevelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientLevelRecord[]): Map<string, string[]> {
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

export function defaultLenientLevelRecordValidator(): LenientLevelRecordValidator {
  return new LenientLevelRecordValidator(
    [
      new LenientLevelRecordRequiredNameRule("lenient level record needs a value"),
      new LenientLevelRecordRequiredCodeRule("lenient level record needs a value"),
      new LenientLevelRecordNameLengthRule(120),
      new LenientLevelRecordBudgetRangeRule(2.4, 4983.2),
      new LenientLevelRecordChannelLengthRule(120),
    ],
  );
}
