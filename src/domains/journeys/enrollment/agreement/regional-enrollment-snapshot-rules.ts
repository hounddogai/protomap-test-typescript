import * as text from "../../../../kit/text.js";
import { RegionalEnrollmentSnapshot } from "./regional-enrollment-snapshot.js";

/** A rule a regional enrollment snapshot must pass. Check returns its problems, or none. */
export interface RegionalEnrollmentSnapshotRule {
  check(item: RegionalEnrollmentSnapshot): string[];
}

export class RegionalEnrollmentSnapshotRequiredTitleRule implements RegionalEnrollmentSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEnrollmentSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEnrollmentSnapshotThresholdRangeRule implements RegionalEnrollmentSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalEnrollmentSnapshot): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalEnrollmentSnapshotAllowedTitleRule implements RegionalEnrollmentSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalEnrollmentSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class RegionalEnrollmentSnapshotChannelLengthRule implements RegionalEnrollmentSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEnrollmentSnapshot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalEnrollmentSnapshotCodePrefixRule implements RegionalEnrollmentSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalEnrollmentSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalEnrollmentSnapshotUnitLengthRule implements RegionalEnrollmentSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEnrollmentSnapshot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional enrollment snapshot. */
export class RegionalEnrollmentSnapshotValidator {
  rules: RegionalEnrollmentSnapshotRule[];

  constructor(rules: RegionalEnrollmentSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalEnrollmentSnapshot): string[] {
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

  requireValid(item: RegionalEnrollmentSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalEnrollmentSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalEnrollmentSnapshotValidator(): RegionalEnrollmentSnapshotValidator {
  return new RegionalEnrollmentSnapshotValidator(
    [
      new RegionalEnrollmentSnapshotRequiredTitleRule("regional enrollment snapshot needs this field"),
      new RegionalEnrollmentSnapshotThresholdRangeRule(4.6, 405.8),
      new RegionalEnrollmentSnapshotAllowedTitleRule(["lenient"]),
      new RegionalEnrollmentSnapshotChannelLengthRule(3600),
      new RegionalEnrollmentSnapshotCodePrefixRule("X"),
      new RegionalEnrollmentSnapshotUnitLengthRule(86400),
    ],
  );
}
