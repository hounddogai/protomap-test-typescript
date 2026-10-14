import { BranchMilestone } from "./branch-milestone.js";

/** A rule a branch milestone must pass. Check returns its problems, or none. */
export interface BranchMilestoneRule {
  check(item: BranchMilestone): string[];
}

export class BranchMilestoneTitleLengthRule implements BranchMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchMilestoneCodePrefixRule implements BranchMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchMilestoneSendAtRangeRule implements BranchMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchMilestone): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a branch milestone. */
export class BranchMilestoneValidator {
  rules: BranchMilestoneRule[];

  constructor(rules: BranchMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BranchMilestone): string[] {
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

  requireValid(item: BranchMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchMilestone[]): Map<string, string[]> {
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

export function defaultBranchMilestoneValidator(): BranchMilestoneValidator {
  return new BranchMilestoneValidator(
    [
      new BranchMilestoneTitleLengthRule(120),
      new BranchMilestoneCodePrefixRule("REF"),
      new BranchMilestoneSendAtRangeRule(64, 120),
    ],
  );
}
