import { RollingCohortMilestone } from "./rolling-cohort-milestone.js";

/** A rule a rolling cohort milestone must pass. Check returns its problems, or none. */
export interface RollingCohortMilestoneRule {
  check(item: RollingCohortMilestone): string[];
}

export class RollingCohortMilestoneTitleLengthRule implements RollingCohortMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCohortMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCohortMilestoneRequiredLocaleRule implements RollingCohortMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCohortMilestone): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCohortMilestoneCodeLengthRule implements RollingCohortMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCohortMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCohortMilestoneRequiredReviewerRule implements RollingCohortMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCohortMilestone): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCohortMilestoneLimitRangeRule implements RollingCohortMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortMilestone): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling cohort milestone. */
export class RollingCohortMilestoneValidator {
  rules: RollingCohortMilestoneRule[];

  constructor(rules: RollingCohortMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCohortMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingCohortMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCohortMilestone[]): Map<string, string[]> {
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

export function defaultRollingCohortMilestoneValidator(): RollingCohortMilestoneValidator {
  return new RollingCohortMilestoneValidator(
    [
      new RollingCohortMilestoneTitleLengthRule(120),
      new RollingCohortMilestoneRequiredLocaleRule("rolling cohort milestone needs an entry"),
      new RollingCohortMilestoneCodeLengthRule(1000),
      new RollingCohortMilestoneRequiredReviewerRule("rolling cohort milestone needs an entry"),
      new RollingCohortMilestoneLimitRangeRule(16, 1000),
    ],
  );
}
