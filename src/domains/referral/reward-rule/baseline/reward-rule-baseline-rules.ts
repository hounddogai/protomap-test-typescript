import { RewardRuleBaseline } from "./reward-rule-baseline.js";

/** A rule a reward rule baseline must pass. Check returns its problems, or none. */
export interface RewardRuleBaselineRule {
  check(item: RewardRuleBaseline): string[];
}

export class RewardRuleBaselineDescriptionLengthRule implements RewardRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleBaseline): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleBaselineRevisionRangeRule implements RewardRuleBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleBaseline): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleBaselineEndsAtRangeRule implements RewardRuleBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleBaseline): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleBaselineRequiredCurrencyRule implements RewardRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleBaseline): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleBaselineCodeLengthRule implements RewardRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule baseline. */
export class RewardRuleBaselineValidator {
  rules: RewardRuleBaselineRule[];

  constructor(rules: RewardRuleBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleBaseline[]): Map<string, string[]> {
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

export function defaultRewardRuleBaselineValidator(): RewardRuleBaselineValidator {
  return new RewardRuleBaselineValidator(
    [
      new RewardRuleBaselineDescriptionLengthRule(80),
      new RewardRuleBaselineRevisionRangeRule(64, 86400),
      new RewardRuleBaselineEndsAtRangeRule(32, 86400),
      new RewardRuleBaselineRequiredCurrencyRule("reward rule baseline needs a value"),
      new RewardRuleBaselineCodeLengthRule(64),
    ],
  );
}
