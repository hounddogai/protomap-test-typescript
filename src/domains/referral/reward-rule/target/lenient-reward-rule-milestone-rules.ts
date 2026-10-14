import { LenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

/** A rule a lenient reward rule milestone must pass. Check returns its problems, or none. */
export interface LenientRewardRuleMilestoneRule {
  check(item: LenientRewardRuleMilestone): string[];
}

export class LenientRewardRuleMilestoneCodeLengthRule implements LenientRewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardRuleMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardRuleMilestoneCapacityRangeRule implements LenientRewardRuleMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardRuleMilestone): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRewardRuleMilestoneBidRangeRule implements LenientRewardRuleMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardRuleMilestone): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRewardRuleMilestoneTitleLengthRule implements LenientRewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardRuleMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient reward rule milestone. */
export class LenientRewardRuleMilestoneValidator {
  rules: LenientRewardRuleMilestoneRule[];

  constructor(rules: LenientRewardRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardRuleMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRewardRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardRuleMilestone[]): Map<string, string[]> {
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

export function defaultLenientRewardRuleMilestoneValidator(): LenientRewardRuleMilestoneValidator {
  return new LenientRewardRuleMilestoneValidator(
    [
      new LenientRewardRuleMilestoneCodeLengthRule(1000),
      new LenientRewardRuleMilestoneCapacityRangeRule(120, 1000),
      new LenientRewardRuleMilestoneBidRangeRule(9.9, 3903),
      new LenientRewardRuleMilestoneTitleLengthRule(120),
    ],
  );
}
