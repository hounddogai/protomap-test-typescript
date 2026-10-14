import { BranchAllocation } from "./branch-allocation.js";

/** A rule a branch allocation must pass. Check returns its problems, or none. */
export interface BranchAllocationRule {
  check(item: BranchAllocation): string[];
}

export class BranchAllocationCodePrefixRule implements BranchAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchAllocationNameLengthRule implements BranchAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchAllocationLimitRangeRule implements BranchAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchAllocation): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchAllocationCategoryLengthRule implements BranchAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchAllocation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch allocation. */
export class BranchAllocationValidator {
  rules: BranchAllocationRule[];

  constructor(rules: BranchAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: BranchAllocation): string[] {
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

  requireValid(item: BranchAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchAllocation[]): Map<string, string[]> {
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

export function defaultBranchAllocationValidator(): BranchAllocationValidator {
  return new BranchAllocationValidator(
    [
      new BranchAllocationCodePrefixRule("Q"),
      new BranchAllocationNameLengthRule(120),
      new BranchAllocationLimitRangeRule(1000, 86400),
      new BranchAllocationCategoryLengthRule(86400),
    ],
  );
}
