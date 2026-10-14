import { BatchedTierMilestone } from "./batched-tier-milestone.js";

/** A rule a batched tier milestone must pass. Check returns its problems, or none. */
export interface BatchedTierMilestoneRule {
  check(item: BatchedTierMilestone): string[];
}

export class BatchedTierMilestoneSendAtRangeRule implements BatchedTierMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierMilestone): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedTierMilestoneImpressionsRangeRule implements BatchedTierMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierMilestone): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTierMilestoneDescriptionLengthRule implements BatchedTierMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTierMilestone): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTierMilestoneOwnerIdLengthRule implements BatchedTierMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTierMilestone): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTierMilestoneBudgetRangeRule implements BatchedTierMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTierMilestone): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched tier milestone. */
export class BatchedTierMilestoneValidator {
  rules: BatchedTierMilestoneRule[];

  constructor(rules: BatchedTierMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTierMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedTierMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTierMilestone[]): Map<string, string[]> {
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

export function defaultBatchedTierMilestoneValidator(): BatchedTierMilestoneValidator {
  return new BatchedTierMilestoneValidator(
    [
      new BatchedTierMilestoneSendAtRangeRule(32, 64),
      new BatchedTierMilestoneImpressionsRangeRule(120, 255),
      new BatchedTierMilestoneDescriptionLengthRule(3600),
      new BatchedTierMilestoneOwnerIdLengthRule(64),
      new BatchedTierMilestoneBudgetRangeRule(8.6, 2312.8),
    ],
  );
}
