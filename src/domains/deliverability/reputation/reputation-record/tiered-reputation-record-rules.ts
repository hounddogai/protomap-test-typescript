import { TieredReputationRecord } from "./tiered-reputation-record.js";

/** A rule a tiered reputation record must pass. Check returns its problems, or none. */
export interface TieredReputationRecordRule {
  check(item: TieredReputationRecord): string[];
}

export class TieredReputationRecordAmountRangeRule implements TieredReputationRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredReputationRecord): string[] {
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

export class TieredReputationRecordRequiredUnitRule implements TieredReputationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredReputationRecord): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class TieredReputationRecordCodePrefixRule implements TieredReputationRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredReputationRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredReputationRecordSourceLengthRule implements TieredReputationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationRecord): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered reputation record. */
export class TieredReputationRecordValidator {
  rules: TieredReputationRecordRule[];

  constructor(rules: TieredReputationRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReputationRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredReputationRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReputationRecord[]): Map<string, string[]> {
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

export function defaultTieredReputationRecordValidator(): TieredReputationRecordValidator {
  return new TieredReputationRecordValidator(
    [
      new TieredReputationRecordAmountRangeRule(5.9, 2162.6),
      new TieredReputationRecordRequiredUnitRule("tiered reputation record needs a value"),
      new TieredReputationRecordCodePrefixRule("OPS"),
      new TieredReputationRecordSourceLengthRule(120),
    ],
  );
}
