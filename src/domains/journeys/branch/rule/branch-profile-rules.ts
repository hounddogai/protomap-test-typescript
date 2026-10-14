import { BranchProfile } from "./branch-profile.js";

/** A rule a branch profile must pass. Check returns its problems, or none. */
export interface BranchProfileRule {
  check(item: BranchProfile): string[];
}

export class BranchProfileRequiredCategoryRule implements BranchProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchProfile): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class BranchProfileRetriesRangeRule implements BranchProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchProfile): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchProfileRequiredCodeRule implements BranchProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchProfileTitleLengthRule implements BranchProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchProfileCategoryLengthRule implements BranchProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchProfile): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch profile. */
export class BranchProfileValidator {
  rules: BranchProfileRule[];

  constructor(rules: BranchProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BranchProfile): string[] {
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

  requireValid(item: BranchProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchProfile[]): Map<string, string[]> {
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

export function defaultBranchProfileValidator(): BranchProfileValidator {
  return new BranchProfileValidator(
    [
      new BranchProfileRequiredCategoryRule("branch profile needs an entry"),
      new BranchProfileRetriesRangeRule(16, 80),
      new BranchProfileRequiredCodeRule("branch profile needs an entry"),
      new BranchProfileTitleLengthRule(86400),
      new BranchProfileCategoryLengthRule(64),
    ],
  );
}
