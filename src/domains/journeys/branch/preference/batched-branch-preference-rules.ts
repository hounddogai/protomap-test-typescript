import { BatchedBranchPreference } from "./batched-branch-preference.js";

/** A rule a batched branch preference must pass. Check returns its problems, or none. */
export interface BatchedBranchPreferenceRule {
  check(item: BatchedBranchPreference): string[];
}

export class BatchedBranchPreferenceCostRangeRule implements BatchedBranchPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBranchPreference): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedBranchPreferenceSegmentLengthRule implements BatchedBranchPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBranchPreference): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedBranchPreferenceTagsLimitRule implements BatchedBranchPreferenceRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedBranchPreference): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class BatchedBranchPreferenceCodePrefixRule implements BatchedBranchPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedBranchPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched branch preference. */
export class BatchedBranchPreferenceValidator {
  rules: BatchedBranchPreferenceRule[];

  constructor(rules: BatchedBranchPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBranchPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBranchPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBranchPreference[]): Map<string, string[]> {
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

export function defaultBatchedBranchPreferenceValidator(): BatchedBranchPreferenceValidator {
  return new BatchedBranchPreferenceValidator(
    [
      new BatchedBranchPreferenceCostRangeRule(2.7, 3492.1),
      new BatchedBranchPreferenceSegmentLengthRule(86400),
      new BatchedBranchPreferenceTagsLimitRule(1000, ["manual", "rolling"]),
      new BatchedBranchPreferenceCodePrefixRule("Q"),
    ],
  );
}
