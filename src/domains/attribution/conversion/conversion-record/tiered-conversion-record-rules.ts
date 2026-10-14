import { TieredConversionRecord } from "./tiered-conversion-record.js";

/** A rule a tiered conversion record must pass. Check returns its problems, or none. */
export interface TieredConversionRecordRule {
  check(item: TieredConversionRecord): string[];
}

export class TieredConversionRecordApprovedGuardRule implements TieredConversionRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredConversionRecord): string[] {
    if (item.approved && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TieredConversionRecordContactEmailLengthRule implements TieredConversionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredConversionRecord): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredConversionRecordEndsAtRangeRule implements TieredConversionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredConversionRecord): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredConversionRecordSendAtRangeRule implements TieredConversionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredConversionRecord): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredConversionRecordRequiredNameRule implements TieredConversionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered conversion record. */
export class TieredConversionRecordValidator {
  rules: TieredConversionRecordRule[];

  constructor(rules: TieredConversionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TieredConversionRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredConversionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredConversionRecord[]): Map<string, string[]> {
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

export function defaultTieredConversionRecordValidator(): TieredConversionRecordValidator {
  return new TieredConversionRecordValidator(
    [
      new TieredConversionRecordApprovedGuardRule(32),
      new TieredConversionRecordContactEmailLengthRule(120),
      new TieredConversionRecordEndsAtRangeRule(64, 3600),
      new TieredConversionRecordSendAtRangeRule(1000, 1000),
      new TieredConversionRecordRequiredNameRule("tiered conversion record needs this field"),
    ],
  );
}
