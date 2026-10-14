import { RegionalStreakRecord } from "./regional-streak-record.js";

/** A rule a regional streak record must pass. Check returns its problems, or none. */
export interface RegionalStreakRecordRule {
  check(item: RegionalStreakRecord): string[];
}

export class RegionalStreakRecordAmountRangeRule implements RegionalStreakRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakRecord): string[] {
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

export class RegionalStreakRecordSourceLengthRule implements RegionalStreakRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStreakRecord): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalStreakRecordCodePrefixRule implements RegionalStreakRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalStreakRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional streak record. */
export class RegionalStreakRecordValidator {
  rules: RegionalStreakRecordRule[];

  constructor(rules: RegionalStreakRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStreakRecord): string[] {
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

  requireValid(item: RegionalStreakRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStreakRecord[]): Map<string, string[]> {
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

export function defaultRegionalStreakRecordValidator(): RegionalStreakRecordValidator {
  return new RegionalStreakRecordValidator(
    [
      new RegionalStreakRecordAmountRangeRule(5.5, 3204.1),
      new RegionalStreakRecordSourceLengthRule(32),
      new RegionalStreakRecordCodePrefixRule("REF"),
    ],
  );
}
