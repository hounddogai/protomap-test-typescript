import * as text from "../../../../kit/text.js";
import { TieredEnrollmentSnapshot } from "./tiered-enrollment-snapshot.js";

/** A rule a tiered enrollment snapshot must pass. Check returns its problems, or none. */
export interface TieredEnrollmentSnapshotRule {
  check(item: TieredEnrollmentSnapshot): string[];
}

export class TieredEnrollmentSnapshotRequiredSegmentRule implements TieredEnrollmentSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentSnapshot): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentSnapshotAllowedChannelRule implements TieredEnrollmentSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredEnrollmentSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is missing`];
    return [];
  }
}

export class TieredEnrollmentSnapshotRateRangeRule implements TieredEnrollmentSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEnrollmentSnapshot): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredEnrollmentSnapshotCodeLengthRule implements TieredEnrollmentSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEnrollmentSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered enrollment snapshot. */
export class TieredEnrollmentSnapshotValidator {
  rules: TieredEnrollmentSnapshotRule[];

  constructor(rules: TieredEnrollmentSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEnrollmentSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredEnrollmentSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEnrollmentSnapshot[]): Map<string, string[]> {
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

export function defaultTieredEnrollmentSnapshotValidator(): TieredEnrollmentSnapshotValidator {
  return new TieredEnrollmentSnapshotValidator(
    [
      new TieredEnrollmentSnapshotRequiredSegmentRule("tiered enrollment snapshot needs an entry"),
      new TieredEnrollmentSnapshotAllowedChannelRule([]),
      new TieredEnrollmentSnapshotRateRangeRule(8.5, 4074.6),
      new TieredEnrollmentSnapshotCodeLengthRule(255),
    ],
  );
}
