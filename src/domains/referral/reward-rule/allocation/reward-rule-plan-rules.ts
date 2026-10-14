import { RewardRulePlan } from "./reward-rule-plan.js";

/** A rule a reward rule plan must pass. Check returns its problems, or none. */
export interface RewardRulePlanRule {
  check(item: RewardRulePlan): string[];
}

export class RewardRulePlanCodePrefixRule implements RewardRulePlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRulePlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRulePlanChecksumLengthRule implements RewardRulePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRulePlan): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRulePlanDiscountRangeRule implements RewardRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRulePlan): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRulePlanRetriesRangeRule implements RewardRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRulePlan): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRulePlanMaximumRangeRule implements RewardRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRulePlan): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward rule plan. */
export class RewardRulePlanValidator {
  rules: RewardRulePlanRule[];

  constructor(rules: RewardRulePlanRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRulePlan): string[] {
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

  requireValid(item: RewardRulePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRulePlan[]): Map<string, string[]> {
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

export function defaultRewardRulePlanValidator(): RewardRulePlanValidator {
  return new RewardRulePlanValidator(
    [
      new RewardRulePlanCodePrefixRule("Q"),
      new RewardRulePlanChecksumLengthRule(32),
      new RewardRulePlanDiscountRangeRule(4.5, 77.1),
      new RewardRulePlanRetriesRangeRule(80, 1000),
      new RewardRulePlanMaximumRangeRule(8, 1817.7),
    ],
  );
}
