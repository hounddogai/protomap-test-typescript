import { RewardPlan } from "./reward-plan.js";

/** A rule a reward plan must pass. Check returns its problems, or none. */
export interface RewardPlanRule {
  check(item: RewardPlan): string[];
}

export class RewardPlanLabelLengthRule implements RewardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardPlanQuantityRangeRule implements RewardPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardPlan): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardPlanRequiredCampaignRefRule implements RewardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardPlan): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RewardPlanRequiredChannelRule implements RewardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardPlan): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward plan. */
export class RewardPlanValidator {
  rules: RewardPlanRule[];

  constructor(rules: RewardPlanRule[]) {
    this.rules = rules;
  }

  validate(item: RewardPlan): string[] {
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

  requireValid(item: RewardPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardPlan[]): Map<string, string[]> {
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

export function defaultRewardPlanValidator(): RewardPlanValidator {
  return new RewardPlanValidator(
    [
      new RewardPlanLabelLengthRule(3600),
      new RewardPlanQuantityRangeRule(120, 1000),
      new RewardPlanRequiredCampaignRefRule("reward plan needs a value"),
      new RewardPlanRequiredChannelRule("reward plan needs an entry"),
    ],
  );
}
