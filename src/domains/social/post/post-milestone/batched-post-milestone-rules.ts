import { BatchedPostMilestone } from "./batched-post-milestone.js";

/** A rule a batched post milestone must pass. Check returns its problems, or none. */
export interface BatchedPostMilestoneRule {
  check(item: BatchedPostMilestone): string[];
}

export class BatchedPostMilestoneRequiredNameRule implements BatchedPostMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPostMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPostMilestoneNameLengthRule implements BatchedPostMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPostMilestoneCodeLengthRule implements BatchedPostMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPostMilestoneSummaryLengthRule implements BatchedPostMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostMilestone): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched post milestone. */
export class BatchedPostMilestoneValidator {
  rules: BatchedPostMilestoneRule[];

  constructor(rules: BatchedPostMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPostMilestone): string[] {
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

  requireValid(item: BatchedPostMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPostMilestone[]): Map<string, string[]> {
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

export function defaultBatchedPostMilestoneValidator(): BatchedPostMilestoneValidator {
  return new BatchedPostMilestoneValidator(
    [
      new BatchedPostMilestoneRequiredNameRule("batched post milestone needs an entry"),
      new BatchedPostMilestoneNameLengthRule(16),
      new BatchedPostMilestoneCodeLengthRule(32),
      new BatchedPostMilestoneSummaryLengthRule(255),
    ],
  );
}
