import { BatchedBranchAssignment } from "./batched-branch-assignment.js";

/** A rule a batched branch assignment must pass. Check returns its problems, or none. */
export interface BatchedBranchAssignmentRule {
  check(item: BatchedBranchAssignment): string[];
}

export class BatchedBranchAssignmentNameLengthRule implements BatchedBranchAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBranchAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedBranchAssignmentTagsLimitRule implements BatchedBranchAssignmentRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedBranchAssignment): string[] {
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

export class BatchedBranchAssignmentRequiredCodeRule implements BatchedBranchAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBranchAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched branch assignment. */
export class BatchedBranchAssignmentValidator {
  rules: BatchedBranchAssignmentRule[];

  constructor(rules: BatchedBranchAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBranchAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBranchAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBranchAssignment[]): Map<string, string[]> {
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

export function defaultBatchedBranchAssignmentValidator(): BatchedBranchAssignmentValidator {
  return new BatchedBranchAssignmentValidator(
    [
      new BatchedBranchAssignmentNameLengthRule(32),
      new BatchedBranchAssignmentTagsLimitRule(255, ["adaptive"]),
      new BatchedBranchAssignmentRequiredCodeRule("batched branch assignment needs an entry"),
    ],
  );
}
