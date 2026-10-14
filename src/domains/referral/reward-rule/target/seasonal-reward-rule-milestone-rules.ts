import { SeasonalRewardRuleMilestone } from "./seasonal-reward-rule-milestone.js";

/** A rule a seasonal reward rule milestone must pass. Check returns its problems, or none. */
export interface SeasonalRewardRuleMilestoneRule {
  check(item: SeasonalRewardRuleMilestone): string[];
}

export class SeasonalRewardRuleMilestoneCodeLengthRule implements SeasonalRewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardRuleMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalRewardRuleMilestoneLabelLengthRule implements SeasonalRewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardRuleMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalRewardRuleMilestoneVariantLengthRule implements SeasonalRewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardRuleMilestone): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal reward rule milestone. */
export class SeasonalRewardRuleMilestoneValidator {
  rules: SeasonalRewardRuleMilestoneRule[];

  constructor(rules: SeasonalRewardRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRewardRuleMilestone): string[] {
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

  requireValid(item: SeasonalRewardRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRewardRuleMilestone[]): Map<string, string[]> {
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

export function defaultSeasonalRewardRuleMilestoneValidator(): SeasonalRewardRuleMilestoneValidator {
  return new SeasonalRewardRuleMilestoneValidator(
    [
      new SeasonalRewardRuleMilestoneCodeLengthRule(1000),
      new SeasonalRewardRuleMilestoneLabelLengthRule(120),
      new SeasonalRewardRuleMilestoneVariantLengthRule(64),
    ],
  );
}
