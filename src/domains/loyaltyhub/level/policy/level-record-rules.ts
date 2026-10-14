import * as text from "../../../../kit/text.js";
import { LevelRecord } from "./level-record.js";

/** A rule a level record must pass. Check returns its problems, or none. */
export interface LevelRecordRule {
  check(item: LevelRecord): string[];
}

export class LevelRecordCodeLengthRule implements LevelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelRecordAllowedTitleRule implements LevelRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class LevelRecordAmountRangeRule implements LevelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelRecord): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelRecordTitleLengthRule implements LevelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelRecordRequiredTitleRule implements LevelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level record. */
export class LevelRecordValidator {
  rules: LevelRecordRule[];

  constructor(rules: LevelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LevelRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelRecord[]): Map<string, string[]> {
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

export function defaultLevelRecordValidator(): LevelRecordValidator {
  return new LevelRecordValidator(
    [
      new LevelRecordCodeLengthRule(86400),
      new LevelRecordAllowedTitleRule(["global", "regional"]),
      new LevelRecordAmountRangeRule(7.3, 427.2),
      new LevelRecordTitleLengthRule(80),
      new LevelRecordRequiredTitleRule("level record needs a value"),
    ],
  );
}
