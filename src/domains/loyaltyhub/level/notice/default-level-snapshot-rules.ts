import { DefaultLevelSnapshot } from "./default-level-snapshot.js";

/** A rule a default level snapshot must pass. Check returns its problems, or none. */
export interface DefaultLevelSnapshotRule {
  check(item: DefaultLevelSnapshot): string[];
}

export class DefaultLevelSnapshotTitleLengthRule implements DefaultLevelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultLevelSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultLevelSnapshotDurationMinutesRangeRule implements DefaultLevelSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultLevelSnapshot): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultLevelSnapshotLimitRangeRule implements DefaultLevelSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultLevelSnapshot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultLevelSnapshotCodeLengthRule implements DefaultLevelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultLevelSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default level snapshot. */
export class DefaultLevelSnapshotValidator {
  rules: DefaultLevelSnapshotRule[];

  constructor(rules: DefaultLevelSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultLevelSnapshot): string[] {
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

  requireValid(item: DefaultLevelSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultLevelSnapshot[]): Map<string, string[]> {
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

export function defaultDefaultLevelSnapshotValidator(): DefaultLevelSnapshotValidator {
  return new DefaultLevelSnapshotValidator(
    [
      new DefaultLevelSnapshotTitleLengthRule(120),
      new DefaultLevelSnapshotDurationMinutesRangeRule(16, 3600),
      new DefaultLevelSnapshotLimitRangeRule(1000, 3600),
      new DefaultLevelSnapshotCodeLengthRule(1000),
    ],
  );
}
