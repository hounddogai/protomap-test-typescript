import { RollingBranchMilestone } from "./rolling-branch-milestone.js";

/** A rule a rolling branch milestone must pass. Check returns its problems, or none. */
export interface RollingBranchMilestoneRule {
  check(item: RollingBranchMilestone): string[];
}

export class RollingBranchMilestoneMarginRangeRule implements RollingBranchMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBranchMilestone): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingBranchMilestoneRequiredCodeRule implements RollingBranchMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBranchMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBranchMilestoneCodeLengthRule implements RollingBranchMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBranchMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBranchMilestoneRequiredTitleRule implements RollingBranchMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBranchMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBranchMilestoneAudienceIdLengthRule implements RollingBranchMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBranchMilestone): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling branch milestone. */
export class RollingBranchMilestoneValidator {
  rules: RollingBranchMilestoneRule[];

  constructor(rules: RollingBranchMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBranchMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingBranchMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBranchMilestone[]): Map<string, string[]> {
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

export function defaultRollingBranchMilestoneValidator(): RollingBranchMilestoneValidator {
  return new RollingBranchMilestoneValidator(
    [
      new RollingBranchMilestoneMarginRangeRule(6.3, 176.6),
      new RollingBranchMilestoneRequiredCodeRule("rolling branch milestone needs a value"),
      new RollingBranchMilestoneCodeLengthRule(32),
      new RollingBranchMilestoneRequiredTitleRule("rolling branch milestone needs an entry"),
      new RollingBranchMilestoneAudienceIdLengthRule(255),
    ],
  );
}
