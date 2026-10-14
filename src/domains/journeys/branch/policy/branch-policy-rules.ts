import { BranchPolicy } from "./branch-policy.js";

/** A rule a branch policy must pass. Check returns its problems, or none. */
export interface BranchPolicyRule {
  check(item: BranchPolicy): string[];
}

export class BranchPolicyReviewerLengthRule implements BranchPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchPolicy): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchPolicyRequiredCodeRule implements BranchPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchPolicyMinimumRangeRule implements BranchPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchPolicy): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a branch policy. */
export class BranchPolicyValidator {
  rules: BranchPolicyRule[];

  constructor(rules: BranchPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BranchPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchPolicy[]): Map<string, string[]> {
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

export function defaultBranchPolicyValidator(): BranchPolicyValidator {
  return new BranchPolicyValidator(
    [
      new BranchPolicyReviewerLengthRule(32),
      new BranchPolicyRequiredCodeRule("branch policy needs this field"),
      new BranchPolicyMinimumRangeRule(0.1, 4007.5),
    ],
  );
}
