import { BatchedCreativeGroup } from "./batched-creative-group.js";

/** A rule a batched creative group must pass. Check returns its problems, or none. */
export interface BatchedCreativeGroupRule {
  check(item: BatchedCreativeGroup): string[];
}

export class BatchedCreativeGroupTitleLengthRule implements BatchedCreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreativeGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreativeGroupContactEmailLengthRule implements BatchedCreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreativeGroup): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreativeGroupRequiredChecksumRule implements BatchedCreativeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreativeGroup): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreativeGroupRequiredTitleRule implements BatchedCreativeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreativeGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched creative group. */
export class BatchedCreativeGroupValidator {
  rules: BatchedCreativeGroupRule[];

  constructor(rules: BatchedCreativeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreativeGroup): string[] {
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

  requireValid(item: BatchedCreativeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreativeGroup[]): Map<string, string[]> {
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

export function defaultBatchedCreativeGroupValidator(): BatchedCreativeGroupValidator {
  return new BatchedCreativeGroupValidator(
    [
      new BatchedCreativeGroupTitleLengthRule(120),
      new BatchedCreativeGroupContactEmailLengthRule(32),
      new BatchedCreativeGroupRequiredChecksumRule("batched creative group needs this field"),
      new BatchedCreativeGroupRequiredTitleRule("batched creative group needs an entry"),
    ],
  );
}
