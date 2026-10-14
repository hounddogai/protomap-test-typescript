import { LenientCohortSnapshot } from "./lenient-cohort-snapshot.js";

/** A rule a lenient cohort snapshot must pass. Check returns its problems, or none. */
export interface LenientCohortSnapshotRule {
  check(item: LenientCohortSnapshot): string[];
}

export class LenientCohortSnapshotCampaignRefLengthRule implements LenientCohortSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortSnapshot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCohortSnapshotDurationMinutesRangeRule implements LenientCohortSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCohortSnapshot): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCohortSnapshotNameLengthRule implements LenientCohortSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient cohort snapshot. */
export class LenientCohortSnapshotValidator {
  rules: LenientCohortSnapshotRule[];

  constructor(rules: LenientCohortSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCohortSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCohortSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCohortSnapshot[]): Map<string, string[]> {
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

export function defaultLenientCohortSnapshotValidator(): LenientCohortSnapshotValidator {
  return new LenientCohortSnapshotValidator(
    [
      new LenientCohortSnapshotCampaignRefLengthRule(120),
      new LenientCohortSnapshotDurationMinutesRangeRule(16, 32),
      new LenientCohortSnapshotNameLengthRule(1000),
    ],
  );
}
