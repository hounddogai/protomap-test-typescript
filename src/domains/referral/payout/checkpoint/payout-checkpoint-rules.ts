import { PayoutCheckpoint } from "./payout-checkpoint.js";

/** A rule a payout checkpoint must pass. Check returns its problems, or none. */
export interface PayoutCheckpointRule {
  check(item: PayoutCheckpoint): string[];
}

export class PayoutCheckpointRequiredRegionRule implements PayoutCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutCheckpoint): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutCheckpointRequiredCodeRule implements PayoutCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutCheckpointNameLengthRule implements PayoutCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutCheckpointRegionLengthRule implements PayoutCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutCheckpoint): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutCheckpointReviewerLengthRule implements PayoutCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutCheckpoint): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutCheckpointCostRangeRule implements PayoutCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutCheckpoint): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout checkpoint. */
export class PayoutCheckpointValidator {
  rules: PayoutCheckpointRule[];

  constructor(rules: PayoutCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutCheckpoint[]): Map<string, string[]> {
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

export function defaultPayoutCheckpointValidator(): PayoutCheckpointValidator {
  return new PayoutCheckpointValidator(
    [
      new PayoutCheckpointRequiredRegionRule("payout checkpoint needs this field"),
      new PayoutCheckpointRequiredCodeRule("payout checkpoint needs this field"),
      new PayoutCheckpointNameLengthRule(16),
      new PayoutCheckpointRegionLengthRule(86400),
      new PayoutCheckpointReviewerLengthRule(16),
      new PayoutCheckpointCostRangeRule(8.2, 4615.5),
    ],
  );
}
