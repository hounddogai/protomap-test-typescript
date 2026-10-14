import { WeightedWindowEntry } from "./weighted-window-entry.js";

/** A rule a weighted window entry must pass. Check returns its problems, or none. */
export interface WeightedWindowEntryRule {
  check(item: WeightedWindowEntry): string[];
}

export class WeightedWindowEntryMinimumRangeRule implements WeightedWindowEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowEntry): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWindowEntrySourceLengthRule implements WeightedWindowEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowEntry): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWindowEntryTitleLengthRule implements WeightedWindowEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWindowEntryDurationMinutesRangeRule implements WeightedWindowEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowEntry): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted window entry. */
export class WeightedWindowEntryValidator {
  rules: WeightedWindowEntryRule[];

  constructor(rules: WeightedWindowEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWindowEntry): string[] {
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

  requireValid(item: WeightedWindowEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWindowEntry[]): Map<string, string[]> {
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

export function defaultWeightedWindowEntryValidator(): WeightedWindowEntryValidator {
  return new WeightedWindowEntryValidator(
    [
      new WeightedWindowEntryMinimumRangeRule(3.1, 739.8),
      new WeightedWindowEntrySourceLengthRule(120),
      new WeightedWindowEntryTitleLengthRule(86400),
      new WeightedWindowEntryDurationMinutesRangeRule(86400, 86400),
    ],
  );
}
