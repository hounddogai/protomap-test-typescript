import { RedemptionMilestone } from "./redemption-milestone.js";

/** A rule a redemption milestone must pass. Check returns its problems, or none. */
export interface RedemptionMilestoneRule {
  check(item: RedemptionMilestone): string[];
}

export class RedemptionMilestoneNameLengthRule implements RedemptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionMilestoneCeilingRangeRule implements RedemptionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionMilestone): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionMilestoneRequiredCodeRule implements RedemptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionMilestoneRequiredLabelRule implements RedemptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionMilestoneLabelLengthRule implements RedemptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption milestone. */
export class RedemptionMilestoneValidator {
  rules: RedemptionMilestoneRule[];

  constructor(rules: RedemptionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionMilestone[]): Map<string, string[]> {
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

export function defaultRedemptionMilestoneValidator(): RedemptionMilestoneValidator {
  return new RedemptionMilestoneValidator(
    [
      new RedemptionMilestoneNameLengthRule(80),
      new RedemptionMilestoneCeilingRangeRule(3.6, 3417.5),
      new RedemptionMilestoneRequiredCodeRule("redemption milestone needs an entry"),
      new RedemptionMilestoneRequiredLabelRule("redemption milestone needs this field"),
      new RedemptionMilestoneLabelLengthRule(255),
    ],
  );
}
