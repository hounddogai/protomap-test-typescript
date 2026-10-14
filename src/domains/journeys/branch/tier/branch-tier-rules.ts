import { BranchTier } from "./branch-tier.js";

/** A rule a branch tier must pass. Check returns its problems, or none. */
export interface BranchTierRule {
  check(item: BranchTier): string[];
}

export class BranchTierBudgetRangeRule implements BranchTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchTier): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchTierCategoryLengthRule implements BranchTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchTier): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchTierStartsAtRangeRule implements BranchTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchTier): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchTierRequiredCodeRule implements BranchTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch tier. */
export class BranchTierValidator {
  rules: BranchTierRule[];

  constructor(rules: BranchTierRule[]) {
    this.rules = rules;
  }

  validate(item: BranchTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchTier[]): Map<string, string[]> {
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

export function defaultBranchTierValidator(): BranchTierValidator {
  return new BranchTierValidator(
    [
      new BranchTierBudgetRangeRule(2, 3631.8),
      new BranchTierCategoryLengthRule(80),
      new BranchTierStartsAtRangeRule(64, 3600),
      new BranchTierRequiredCodeRule("branch tier needs a value"),
    ],
  );
}
