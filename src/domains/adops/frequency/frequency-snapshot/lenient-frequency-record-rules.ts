import { LenientFrequencyRecord } from "./lenient-frequency-record.js";

/** A rule a lenient frequency record must pass. Check returns its problems, or none. */
export interface LenientFrequencyRecordRule {
  check(item: LenientFrequencyRecord): string[];
}

export class LenientFrequencyRecordCreatedAtRangeRule implements LenientFrequencyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFrequencyRecord): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFrequencyRecordCeilingRangeRule implements LenientFrequencyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFrequencyRecord): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFrequencyRecordCodePrefixRule implements LenientFrequencyRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFrequencyRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient frequency record. */
export class LenientFrequencyRecordValidator {
  rules: LenientFrequencyRecordRule[];

  constructor(rules: LenientFrequencyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFrequencyRecord): string[] {
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

  requireValid(item: LenientFrequencyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFrequencyRecord[]): Map<string, string[]> {
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

export function defaultLenientFrequencyRecordValidator(): LenientFrequencyRecordValidator {
  return new LenientFrequencyRecordValidator(
    [
      new LenientFrequencyRecordCreatedAtRangeRule(1000, 3600),
      new LenientFrequencyRecordCeilingRangeRule(6.6, 2439.4),
      new LenientFrequencyRecordCodePrefixRule("Q"),
    ],
  );
}
