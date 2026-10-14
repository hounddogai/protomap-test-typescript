import { RewardRuleTarget } from "./reward-rule-target.js";

/** A rule a reward rule target must pass. Check returns its problems, or none. */
export interface RewardRuleTargetRule {
  check(item: RewardRuleTarget): string[];
}

export class RewardRuleTargetAmountRangeRule implements RewardRuleTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleTarget): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleTargetLabelLengthRule implements RewardRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleTargetRequiredCodeRule implements RewardRuleTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleTargetTimezoneLengthRule implements RewardRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleTarget): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule target. */
export class RewardRuleTargetValidator {
  rules: RewardRuleTargetRule[];

  constructor(rules: RewardRuleTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleTarget[]): Map<string, string[]> {
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

export function defaultRewardRuleTargetValidator(): RewardRuleTargetValidator {
  return new RewardRuleTargetValidator(
    [
      new RewardRuleTargetAmountRangeRule(0.5, 4747.4),
      new RewardRuleTargetLabelLengthRule(32),
      new RewardRuleTargetRequiredCodeRule("reward rule target needs a value"),
      new RewardRuleTargetTimezoneLengthRule(16),
    ],
  );
}
