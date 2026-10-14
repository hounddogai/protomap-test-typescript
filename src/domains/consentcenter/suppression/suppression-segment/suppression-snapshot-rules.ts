import { SuppressionSnapshot } from "./suppression-snapshot.js";

/** A rule a suppression snapshot must pass. Check returns its problems, or none. */
export interface SuppressionSnapshotRule {
  check(item: SuppressionSnapshot): string[];
}

export class SuppressionSnapshotLabelLengthRule implements SuppressionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionSnapshotPinnedGuardRule implements SuppressionSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SuppressionSnapshot): string[] {
    if (item.pinned && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SuppressionSnapshotRequiredOwnerIdRule implements SuppressionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionSnapshot): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionSnapshotWeightRangeRule implements SuppressionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionSnapshot): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a suppression snapshot. */
export class SuppressionSnapshotValidator {
  rules: SuppressionSnapshotRule[];

  constructor(rules: SuppressionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionSnapshot[]): Map<string, string[]> {
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

export function defaultSuppressionSnapshotValidator(): SuppressionSnapshotValidator {
  return new SuppressionSnapshotValidator(
    [
      new SuppressionSnapshotLabelLengthRule(86400),
      new SuppressionSnapshotPinnedGuardRule(9.9),
      new SuppressionSnapshotRequiredOwnerIdRule("suppression snapshot needs an entry"),
      new SuppressionSnapshotWeightRangeRule(5.8, 335.1),
    ],
  );
}
