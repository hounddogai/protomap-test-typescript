import { BatchedOptOutAllocation } from "./batched-opt-out-allocation.js";

/** A rule a batched opt out allocation must pass. Check returns its problems, or none. */
export interface BatchedOptOutAllocationRule {
  check(item: BatchedOptOutAllocation): string[];
}

export class BatchedOptOutAllocationTitleLengthRule implements BatchedOptOutAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedOptOutAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedOptOutAllocationRequiredVariantRule implements BatchedOptOutAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedOptOutAllocation): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedOptOutAllocationCodeLengthRule implements BatchedOptOutAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedOptOutAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedOptOutAllocationTagsLimitRule implements BatchedOptOutAllocationRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedOptOutAllocation): string[] {
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

export class BatchedOptOutAllocationContactEmailLengthRule implements BatchedOptOutAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedOptOutAllocation): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedOptOutAllocationRequiredTitleRule implements BatchedOptOutAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedOptOutAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched opt out allocation. */
export class BatchedOptOutAllocationValidator {
  rules: BatchedOptOutAllocationRule[];

  constructor(rules: BatchedOptOutAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedOptOutAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedOptOutAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedOptOutAllocation[]): Map<string, string[]> {
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

export function defaultBatchedOptOutAllocationValidator(): BatchedOptOutAllocationValidator {
  return new BatchedOptOutAllocationValidator(
    [
      new BatchedOptOutAllocationTitleLengthRule(3600),
      new BatchedOptOutAllocationRequiredVariantRule("batched opt out allocation needs a value"),
      new BatchedOptOutAllocationCodeLengthRule(16),
      new BatchedOptOutAllocationTagsLimitRule(1000, []),
      new BatchedOptOutAllocationContactEmailLengthRule(16),
      new BatchedOptOutAllocationRequiredTitleRule("batched opt out allocation needs an entry"),
    ],
  );
}
