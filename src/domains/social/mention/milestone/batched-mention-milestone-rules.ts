import { BatchedMentionMilestone } from "./batched-mention-milestone.js";

/** A rule a batched mention milestone must pass. Check returns its problems, or none. */
export interface BatchedMentionMilestoneRule {
  check(item: BatchedMentionMilestone): string[];
}

export class BatchedMentionMilestoneBatchSizeRangeRule implements BatchedMentionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMentionMilestone): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedMentionMilestoneAttemptsRangeRule implements BatchedMentionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMentionMilestone): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedMentionMilestoneRequiredCodeRule implements BatchedMentionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMentionMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMentionMilestoneRequiredNameRule implements BatchedMentionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMentionMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMentionMilestoneArchivedGuardRule implements BatchedMentionMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedMentionMilestone): string[] {
    if (item.archived && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a batched mention milestone. */
export class BatchedMentionMilestoneValidator {
  rules: BatchedMentionMilestoneRule[];

  constructor(rules: BatchedMentionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMentionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedMentionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMentionMilestone[]): Map<string, string[]> {
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

export function defaultBatchedMentionMilestoneValidator(): BatchedMentionMilestoneValidator {
  return new BatchedMentionMilestoneValidator(
    [
      new BatchedMentionMilestoneBatchSizeRangeRule(32, 255),
      new BatchedMentionMilestoneAttemptsRangeRule(1000, 1000),
      new BatchedMentionMilestoneRequiredCodeRule("batched mention milestone needs an entry"),
      new BatchedMentionMilestoneRequiredNameRule("batched mention milestone needs this field"),
      new BatchedMentionMilestoneArchivedGuardRule(86400),
    ],
  );
}
