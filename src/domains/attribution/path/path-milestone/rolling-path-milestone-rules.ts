import { RollingPathMilestone } from "./rolling-path-milestone.js";

/** A rule a rolling path milestone must pass. Check returns its problems, or none. */
export interface RollingPathMilestoneRule {
  check(item: RollingPathMilestone): string[];
}

export class RollingPathMilestoneMaximumRangeRule implements RollingPathMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPathMilestone): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingPathMilestoneCategoryLengthRule implements RollingPathMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPathMilestone): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPathMilestoneCodePrefixRule implements RollingPathMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPathMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPathMilestoneRequiredCategoryRule implements RollingPathMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPathMilestone): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling path milestone. */
export class RollingPathMilestoneValidator {
  rules: RollingPathMilestoneRule[];

  constructor(rules: RollingPathMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPathMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPathMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPathMilestone[]): Map<string, string[]> {
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

export function defaultRollingPathMilestoneValidator(): RollingPathMilestoneValidator {
  return new RollingPathMilestoneValidator(
    [
      new RollingPathMilestoneMaximumRangeRule(5.4, 1224.6),
      new RollingPathMilestoneCategoryLengthRule(120),
      new RollingPathMilestoneCodePrefixRule("ACM"),
      new RollingPathMilestoneRequiredCategoryRule("rolling path milestone needs this field"),
    ],
  );
}
