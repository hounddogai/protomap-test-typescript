import { RollingNudgeSnapshot } from "./rolling-nudge-snapshot.js";

/** A rule a rolling nudge snapshot must pass. Check returns its problems, or none. */
export interface RollingNudgeSnapshotRule {
  check(item: RollingNudgeSnapshot): string[];
}

export class RollingNudgeSnapshotRequiredCodeRule implements RollingNudgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeSnapshotClicksRangeRule implements RollingNudgeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeSnapshot): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingNudgeSnapshotDiscountRangeRule implements RollingNudgeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeSnapshot): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingNudgeSnapshotNameLengthRule implements RollingNudgeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeSnapshotRequiredNameRule implements RollingNudgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling nudge snapshot. */
export class RollingNudgeSnapshotValidator {
  rules: RollingNudgeSnapshotRule[];

  constructor(rules: RollingNudgeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeSnapshot): string[] {
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

  requireValid(item: RollingNudgeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeSnapshot[]): Map<string, string[]> {
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

export function defaultRollingNudgeSnapshotValidator(): RollingNudgeSnapshotValidator {
  return new RollingNudgeSnapshotValidator(
    [
      new RollingNudgeSnapshotRequiredCodeRule("rolling nudge snapshot needs a value"),
      new RollingNudgeSnapshotClicksRangeRule(1000, 86400),
      new RollingNudgeSnapshotDiscountRangeRule(7.8, 4979),
      new RollingNudgeSnapshotNameLengthRule(255),
      new RollingNudgeSnapshotRequiredNameRule("rolling nudge snapshot needs a value"),
    ],
  );
}
