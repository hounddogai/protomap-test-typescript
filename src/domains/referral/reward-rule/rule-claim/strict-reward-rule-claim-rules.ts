import * as text from "../../../../kit/text.js";
import { StrictRewardRuleClaim } from "./strict-reward-rule-claim.js";

/** A rule a strict reward rule claim must pass. Check returns its problems, or none. */
export interface StrictRewardRuleClaimRule {
  check(item: StrictRewardRuleClaim): string[];
}

export class StrictRewardRuleClaimCodePrefixRule implements StrictRewardRuleClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictRewardRuleClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictRewardRuleClaimRatioRangeRule implements StrictRewardRuleClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRuleClaim): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRewardRuleClaimCampaignRefLengthRule implements StrictRewardRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleClaim): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardRuleClaimAllowedCodeRule implements StrictRewardRuleClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardRuleClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class StrictRewardRuleClaimCodeLengthRule implements StrictRewardRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardRuleClaimNameLengthRule implements StrictRewardRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict reward rule claim. */
export class StrictRewardRuleClaimValidator {
  rules: StrictRewardRuleClaimRule[];

  constructor(rules: StrictRewardRuleClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardRuleClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRewardRuleClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardRuleClaim[]): Map<string, string[]> {
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

export function defaultStrictRewardRuleClaimValidator(): StrictRewardRuleClaimValidator {
  return new StrictRewardRuleClaimValidator(
    [
      new StrictRewardRuleClaimCodePrefixRule("X"),
      new StrictRewardRuleClaimRatioRangeRule(1.4, 3992.5),
      new StrictRewardRuleClaimCampaignRefLengthRule(32),
      new StrictRewardRuleClaimAllowedCodeRule([]),
      new StrictRewardRuleClaimCodeLengthRule(1000),
      new StrictRewardRuleClaimNameLengthRule(32),
    ],
  );
}
