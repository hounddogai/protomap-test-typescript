import { LevelSnapshot } from "./level-snapshot.js";

/** A rule a level snapshot must pass. Check returns its problems, or none. */
export interface LevelSnapshotRule {
  check(item: LevelSnapshot): string[];
}

export class LevelSnapshotSegmentLengthRule implements LevelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSnapshot): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelSnapshotDiscountRangeRule implements LevelSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelSnapshot): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelSnapshotCodePrefixRule implements LevelSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a level snapshot. */
export class LevelSnapshotValidator {
  rules: LevelSnapshotRule[];

  constructor(rules: LevelSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: LevelSnapshot): string[] {
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

  requireValid(item: LevelSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelSnapshot[]): Map<string, string[]> {
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

export function defaultLevelSnapshotValidator(): LevelSnapshotValidator {
  return new LevelSnapshotValidator(
    [
      new LevelSnapshotSegmentLengthRule(32),
      new LevelSnapshotDiscountRangeRule(6.4, 3126.9),
      new LevelSnapshotCodePrefixRule("REF"),
    ],
  );
}
