import { TieredFraudCheckCheckpoint } from "./tiered-fraud-check-checkpoint.js";

/** A rule a tiered fraud check checkpoint must pass. Check returns its problems, or none. */
export interface TieredFraudCheckCheckpointRule {
  check(item: TieredFraudCheckCheckpoint): string[];
}

export class TieredFraudCheckCheckpointSegmentLengthRule implements TieredFraudCheckCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFraudCheckCheckpoint): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFraudCheckCheckpointCodeLengthRule implements TieredFraudCheckCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFraudCheckCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFraudCheckCheckpointAmountRangeRule implements TieredFraudCheckCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFraudCheckCheckpoint): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredFraudCheckCheckpointVisibleGuardRule implements TieredFraudCheckCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredFraudCheckCheckpoint): string[] {
    if (item.visible && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a tiered fraud check checkpoint. */
export class TieredFraudCheckCheckpointValidator {
  rules: TieredFraudCheckCheckpointRule[];

  constructor(rules: TieredFraudCheckCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFraudCheckCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFraudCheckCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFraudCheckCheckpoint[]): Map<string, string[]> {
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

export function defaultTieredFraudCheckCheckpointValidator(): TieredFraudCheckCheckpointValidator {
  return new TieredFraudCheckCheckpointValidator(
    [
      new TieredFraudCheckCheckpointSegmentLengthRule(80),
      new TieredFraudCheckCheckpointCodeLengthRule(16),
      new TieredFraudCheckCheckpointAmountRangeRule(9.6, 95.6),
      new TieredFraudCheckCheckpointVisibleGuardRule(8.7),
    ],
  );
}
