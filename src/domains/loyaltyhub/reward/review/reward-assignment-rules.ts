import { RewardAssignment } from "./reward-assignment.js";

/** A rule a reward assignment must pass. Check returns its problems, or none. */
export interface RewardAssignmentRule {
  check(item: RewardAssignment): string[];
}

export class RewardAssignmentGraceDaysRangeRule implements RewardAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardAssignment): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardAssignmentRequiredOwnerIdRule implements RewardAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardAssignment): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RewardAssignmentRetriesRangeRule implements RewardAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardAssignment): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardAssignmentOwnerIdLengthRule implements RewardAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardAssignment): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardAssignmentUnitLengthRule implements RewardAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardAssignment): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardAssignmentRatioRangeRule implements RewardAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardAssignment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward assignment. */
export class RewardAssignmentValidator {
  rules: RewardAssignmentRule[];

  constructor(rules: RewardAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RewardAssignment): string[] {
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

  requireValid(item: RewardAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardAssignment[]): Map<string, string[]> {
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

export function defaultRewardAssignmentValidator(): RewardAssignmentValidator {
  return new RewardAssignmentValidator(
    [
      new RewardAssignmentGraceDaysRangeRule(32, 120),
      new RewardAssignmentRequiredOwnerIdRule("reward assignment needs this field"),
      new RewardAssignmentRetriesRangeRule(1000, 3600),
      new RewardAssignmentOwnerIdLengthRule(3600),
      new RewardAssignmentUnitLengthRule(120),
      new RewardAssignmentRatioRangeRule(9.7, 4033.1),
    ],
  );
}
