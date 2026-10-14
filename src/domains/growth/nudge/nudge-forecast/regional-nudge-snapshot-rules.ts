import { RegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

/** A rule a regional nudge snapshot must pass. Check returns its problems, or none. */
export interface RegionalNudgeSnapshotRule {
  check(item: RegionalNudgeSnapshot): string[];
}

export class RegionalNudgeSnapshotReviewerLengthRule implements RegionalNudgeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalNudgeSnapshot): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalNudgeSnapshotDurationMinutesRangeRule implements RegionalNudgeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalNudgeSnapshot): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalNudgeSnapshotExternalRefLengthRule implements RegionalNudgeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalNudgeSnapshot): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalNudgeSnapshotRequiredLabelRule implements RegionalNudgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalNudgeSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional nudge snapshot. */
export class RegionalNudgeSnapshotValidator {
  rules: RegionalNudgeSnapshotRule[];

  constructor(rules: RegionalNudgeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalNudgeSnapshot): string[] {
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

  requireValid(item: RegionalNudgeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalNudgeSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalNudgeSnapshotValidator(): RegionalNudgeSnapshotValidator {
  return new RegionalNudgeSnapshotValidator(
    [
      new RegionalNudgeSnapshotReviewerLengthRule(120),
      new RegionalNudgeSnapshotDurationMinutesRangeRule(32, 86400),
      new RegionalNudgeSnapshotExternalRefLengthRule(3600),
      new RegionalNudgeSnapshotRequiredLabelRule("regional nudge snapshot needs a value"),
    ],
  );
}
