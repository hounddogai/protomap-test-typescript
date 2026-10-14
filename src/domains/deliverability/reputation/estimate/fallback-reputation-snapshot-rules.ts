import { FallbackReputationSnapshot } from "./fallback-reputation-snapshot.js";

/** A rule a fallback reputation snapshot must pass. Check returns its problems, or none. */
export interface FallbackReputationSnapshotRule {
  check(item: FallbackReputationSnapshot): string[];
}

export class FallbackReputationSnapshotPriorityRangeRule implements FallbackReputationSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReputationSnapshot): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackReputationSnapshotVariantLengthRule implements FallbackReputationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReputationSnapshot): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReputationSnapshotCodeLengthRule implements FallbackReputationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReputationSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reputation snapshot. */
export class FallbackReputationSnapshotValidator {
  rules: FallbackReputationSnapshotRule[];

  constructor(rules: FallbackReputationSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReputationSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackReputationSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReputationSnapshot[]): Map<string, string[]> {
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

export function defaultFallbackReputationSnapshotValidator(): FallbackReputationSnapshotValidator {
  return new FallbackReputationSnapshotValidator(
    [
      new FallbackReputationSnapshotPriorityRangeRule(32, 255),
      new FallbackReputationSnapshotVariantLengthRule(255),
      new FallbackReputationSnapshotCodeLengthRule(1000),
    ],
  );
}
