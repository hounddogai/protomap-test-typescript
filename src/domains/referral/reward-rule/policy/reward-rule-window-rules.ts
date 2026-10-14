import { RewardRuleWindow } from "./reward-rule-window.js";

/** A rule a reward rule window must pass. Check returns its problems, or none. */
export interface RewardRuleWindowRule {
  check(item: RewardRuleWindow): string[];
}

export class RewardRuleWindowExternalRefLengthRule implements RewardRuleWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleWindow): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleWindowRequiredNameRule implements RewardRuleWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleWindowCodePrefixRule implements RewardRuleWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleWindowRatioRangeRule implements RewardRuleWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleWindow): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward rule window. */
export class RewardRuleWindowValidator {
  rules: RewardRuleWindowRule[];

  constructor(rules: RewardRuleWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleWindow[]): Map<string, string[]> {
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

export function defaultRewardRuleWindowValidator(): RewardRuleWindowValidator {
  return new RewardRuleWindowValidator(
    [
      new RewardRuleWindowExternalRefLengthRule(255),
      new RewardRuleWindowRequiredNameRule("reward rule window needs this field"),
      new RewardRuleWindowCodePrefixRule("X"),
      new RewardRuleWindowRatioRangeRule(6.3, 338.2),
    ],
  );
}
