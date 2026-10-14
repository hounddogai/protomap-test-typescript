import { BatchedPostProfile } from "./batched-post-profile.js";

/** A rule a batched post profile must pass. Check returns its problems, or none. */
export interface BatchedPostProfileRule {
  check(item: BatchedPostProfile): string[];
}

export class BatchedPostProfileTagsLimitRule implements BatchedPostProfileRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedPostProfile): string[] {
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

export class BatchedPostProfileLabelLengthRule implements BatchedPostProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPostProfileSegmentLengthRule implements BatchedPostProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostProfile): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPostProfileRequiredTitleRule implements BatchedPostProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPostProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched post profile. */
export class BatchedPostProfileValidator {
  rules: BatchedPostProfileRule[];

  constructor(rules: BatchedPostProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPostProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPostProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPostProfile[]): Map<string, string[]> {
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

export function defaultBatchedPostProfileValidator(): BatchedPostProfileValidator {
  return new BatchedPostProfileValidator(
    [
      new BatchedPostProfileTagsLimitRule(16, ["regional", "default"]),
      new BatchedPostProfileLabelLengthRule(255),
      new BatchedPostProfileSegmentLengthRule(80),
      new BatchedPostProfileRequiredTitleRule("batched post profile needs this field"),
    ],
  );
}
