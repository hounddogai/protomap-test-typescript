import { FunnelRecord } from "./funnel-record.js";

/** A rule a funnel record must pass. Check returns its problems, or none. */
export interface FunnelRecordRule {
  check(item: FunnelRecord): string[];
}

export class FunnelRecordCodeLengthRule implements FunnelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRecordLabelLengthRule implements FunnelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRecordCreatedAtRangeRule implements FunnelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelRecord): string[] {
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

/** Runs every rule of a funnel record. */
export class FunnelRecordValidator {
  rules: FunnelRecordRule[];

  constructor(rules: FunnelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelRecord[]): Map<string, string[]> {
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

export function defaultFunnelRecordValidator(): FunnelRecordValidator {
  return new FunnelRecordValidator(
    [
      new FunnelRecordCodeLengthRule(255),
      new FunnelRecordLabelLengthRule(64),
      new FunnelRecordCreatedAtRangeRule(16, 3600),
    ],
  );
}
