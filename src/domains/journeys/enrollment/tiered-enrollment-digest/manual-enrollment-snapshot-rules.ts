import * as text from "../../../../kit/text.js";
import { ManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

/** A rule a manual enrollment snapshot must pass. Check returns its problems, or none. */
export interface ManualEnrollmentSnapshotRule {
  check(item: ManualEnrollmentSnapshot): string[];
}

export class ManualEnrollmentSnapshotSendAtRangeRule implements ManualEnrollmentSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEnrollmentSnapshot): string[] {
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

export class ManualEnrollmentSnapshotAudienceIdLengthRule implements ManualEnrollmentSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEnrollmentSnapshot): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEnrollmentSnapshotAllowedLabelRule implements ManualEnrollmentSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualEnrollmentSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class ManualEnrollmentSnapshotRequiredCodeRule implements ManualEnrollmentSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual enrollment snapshot. */
export class ManualEnrollmentSnapshotValidator {
  rules: ManualEnrollmentSnapshotRule[];

  constructor(rules: ManualEnrollmentSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEnrollmentSnapshot): string[] {
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

  requireValid(item: ManualEnrollmentSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEnrollmentSnapshot[]): Map<string, string[]> {
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

export function defaultManualEnrollmentSnapshotValidator(): ManualEnrollmentSnapshotValidator {
  return new ManualEnrollmentSnapshotValidator(
    [
      new ManualEnrollmentSnapshotSendAtRangeRule(16, 64),
      new ManualEnrollmentSnapshotAudienceIdLengthRule(80),
      new ManualEnrollmentSnapshotAllowedLabelRule(["lenient", "tiered"]),
      new ManualEnrollmentSnapshotRequiredCodeRule("manual enrollment snapshot needs this field"),
    ],
  );
}
