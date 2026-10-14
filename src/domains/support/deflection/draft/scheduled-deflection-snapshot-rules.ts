import { ScheduledDeflectionSnapshot } from "./scheduled-deflection-snapshot.js";

/** A rule a scheduled deflection snapshot must pass. Check returns its problems, or none. */
export interface ScheduledDeflectionSnapshotRule {
  check(item: ScheduledDeflectionSnapshot): string[];
}

export class ScheduledDeflectionSnapshotLimitRangeRule implements ScheduledDeflectionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDeflectionSnapshot): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledDeflectionSnapshotCodeLengthRule implements ScheduledDeflectionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionSnapshotUtmSourceLengthRule implements ScheduledDeflectionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionSnapshot): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled deflection snapshot. */
export class ScheduledDeflectionSnapshotValidator {
  rules: ScheduledDeflectionSnapshotRule[];

  constructor(rules: ScheduledDeflectionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDeflectionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledDeflectionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDeflectionSnapshot[]): Map<string, string[]> {
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

export function defaultScheduledDeflectionSnapshotValidator(): ScheduledDeflectionSnapshotValidator {
  return new ScheduledDeflectionSnapshotValidator(
    [
      new ScheduledDeflectionSnapshotLimitRangeRule(16, 255),
      new ScheduledDeflectionSnapshotCodeLengthRule(80),
      new ScheduledDeflectionSnapshotUtmSourceLengthRule(16),
    ],
  );
}
