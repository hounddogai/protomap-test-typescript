import { TieredStreakSummary } from "./tiered-streak-summary.js";

/** A rule a tiered streak summary must pass. Check returns its problems, or none. */
export interface TieredStreakSummaryRule {
  check(item: TieredStreakSummary): string[];
}

export class TieredStreakSummaryVersionRangeRule implements TieredStreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStreakSummary): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredStreakSummaryNameLengthRule implements TieredStreakSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStreakSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStreakSummaryRequiredCodeRule implements TieredStreakSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredStreakSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered streak summary. */
export class TieredStreakSummaryValidator {
  rules: TieredStreakSummaryRule[];

  constructor(rules: TieredStreakSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredStreakSummary): string[] {
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

  requireValid(item: TieredStreakSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredStreakSummary[]): Map<string, string[]> {
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

export function defaultTieredStreakSummaryValidator(): TieredStreakSummaryValidator {
  return new TieredStreakSummaryValidator(
    [
      new TieredStreakSummaryVersionRangeRule(16, 64),
      new TieredStreakSummaryNameLengthRule(64),
      new TieredStreakSummaryRequiredCodeRule("tiered streak summary needs an entry"),
    ],
  );
}
