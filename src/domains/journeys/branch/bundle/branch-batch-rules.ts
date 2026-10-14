import { BranchBatch } from "./branch-batch.js";

/** A rule a branch batch must pass. Check returns its problems, or none. */
export interface BranchBatchRule {
  check(item: BranchBatch): string[];
}

export class BranchBatchCodePrefixRule implements BranchBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchBatchCodeLengthRule implements BranchBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchBatchRequiredNameRule implements BranchBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BranchBatchRegionLengthRule implements BranchBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBatch): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchBatchEndsAtRangeRule implements BranchBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchBatch): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchBatchPhoneLengthRule implements BranchBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBatch): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch batch. */
export class BranchBatchValidator {
  rules: BranchBatchRule[];

  constructor(rules: BranchBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BranchBatch): string[] {
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

  requireValid(item: BranchBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchBatch[]): Map<string, string[]> {
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

export function defaultBranchBatchValidator(): BranchBatchValidator {
  return new BranchBatchValidator(
    [
      new BranchBatchCodePrefixRule("ACM"),
      new BranchBatchCodeLengthRule(255),
      new BranchBatchRequiredNameRule("branch batch needs a value"),
      new BranchBatchRegionLengthRule(3600),
      new BranchBatchEndsAtRangeRule(16, 64),
      new BranchBatchPhoneLengthRule(80),
    ],
  );
}
