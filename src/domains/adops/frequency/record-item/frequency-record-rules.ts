import { FrequencyRecord } from "./frequency-record.js";

/** A rule a frequency record must pass. Check returns its problems, or none. */
export interface FrequencyRecordRule {
  check(item: FrequencyRecord): string[];
}

export class FrequencyRecordCodeLengthRule implements FrequencyRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyRecordRequiredCodeRule implements FrequencyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyRecordLabelLengthRule implements FrequencyRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyRecordRequiredSegmentRule implements FrequencyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyRecord): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyRecordRatioRangeRule implements FrequencyRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyRecord): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a frequency record. */
export class FrequencyRecordValidator {
  rules: FrequencyRecordRule[];

  constructor(rules: FrequencyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyRecord): string[] {
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

  requireValid(item: FrequencyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyRecord[]): Map<string, string[]> {
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

export function defaultFrequencyRecordValidator(): FrequencyRecordValidator {
  return new FrequencyRecordValidator(
    [
      new FrequencyRecordCodeLengthRule(1000),
      new FrequencyRecordRequiredCodeRule("frequency record needs an entry"),
      new FrequencyRecordLabelLengthRule(86400),
      new FrequencyRecordRequiredSegmentRule("frequency record needs this field"),
      new FrequencyRecordRatioRangeRule(9.1, 2086.1),
    ],
  );
}
