import { RewardRulePolicy } from "./reward-rule-policy.js";

/** A rule a reward rule policy must pass. Check returns its problems, or none. */
export interface RewardRulePolicyRule {
  check(item: RewardRulePolicy): string[];
}

export class RewardRulePolicyRequiredJourneyIdRule implements RewardRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRulePolicy): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRulePolicyUpdatedAtRangeRule implements RewardRulePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRulePolicy): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRulePolicyFloorValueRangeRule implements RewardRulePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRulePolicy): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRulePolicyRequiredCodeRule implements RewardRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRulePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule policy. */
export class RewardRulePolicyValidator {
  rules: RewardRulePolicyRule[];

  constructor(rules: RewardRulePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRulePolicy): string[] {
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

  requireValid(item: RewardRulePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRulePolicy[]): Map<string, string[]> {
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

export function defaultRewardRulePolicyValidator(): RewardRulePolicyValidator {
  return new RewardRulePolicyValidator(
    [
      new RewardRulePolicyRequiredJourneyIdRule("reward rule policy needs an entry"),
      new RewardRulePolicyUpdatedAtRangeRule(120, 3600),
      new RewardRulePolicyFloorValueRangeRule(9.4, 4291.7),
      new RewardRulePolicyRequiredCodeRule("reward rule policy needs an entry"),
    ],
  );
}
