import * as text from "../../../../kit/text.js";
import { RewardRuleClaim } from "./reward-rule-claim.js";

/** A rule a reward rule claim must pass. Check returns its problems, or none. */
export interface RewardRuleClaimRule {
  check(item: RewardRuleClaim): string[];
}

export class RewardRuleClaimAllowedPhoneRule implements RewardRuleClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

export class RewardRuleClaimRequiredSourceRule implements RewardRuleClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleClaim): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleClaimRequiredLabelRule implements RewardRuleClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleClaimSourceLengthRule implements RewardRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleClaim): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleClaimLimitRangeRule implements RewardRuleClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleClaim): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleClaimLabelLengthRule implements RewardRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule claim. */
export class RewardRuleClaimValidator {
  rules: RewardRuleClaimRule[];

  constructor(rules: RewardRuleClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleClaim): string[] {
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

  requireValid(item: RewardRuleClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleClaim[]): Map<string, string[]> {
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

export function defaultRewardRuleClaimValidator(): RewardRuleClaimValidator {
  return new RewardRuleClaimValidator(
    [
      new RewardRuleClaimAllowedPhoneRule(["manual", "regional", "weighted"]),
      new RewardRuleClaimRequiredSourceRule("reward rule claim needs an entry"),
      new RewardRuleClaimRequiredLabelRule("reward rule claim needs this field"),
      new RewardRuleClaimSourceLengthRule(86400),
      new RewardRuleClaimLimitRangeRule(1000, 86400),
      new RewardRuleClaimLabelLengthRule(3600),
    ],
  );
}
