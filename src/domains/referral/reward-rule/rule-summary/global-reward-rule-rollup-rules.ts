import { GlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

/** A rule a global reward rule rollup must pass. Check returns its problems, or none. */
export interface GlobalRewardRuleRollupRule {
  check(item: GlobalRewardRuleRollup): string[];
}

export class GlobalRewardRuleRollupCampaignRefLengthRule implements GlobalRewardRuleRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardRuleRollup): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardRuleRollupRevisionRangeRule implements GlobalRewardRuleRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardRuleRollup): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRewardRuleRollupRequiredTitleRule implements GlobalRewardRuleRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleRollupRequiredCampaignRefRule implements GlobalRewardRuleRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleRollup): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleRollupRequiredCountryRule implements GlobalRewardRuleRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleRollup): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleRollupCodeLengthRule implements GlobalRewardRuleRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardRuleRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global reward rule rollup. */
export class GlobalRewardRuleRollupValidator {
  rules: GlobalRewardRuleRollupRule[];

  constructor(rules: GlobalRewardRuleRollupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardRuleRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRewardRuleRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardRuleRollup[]): Map<string, string[]> {
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

export function defaultGlobalRewardRuleRollupValidator(): GlobalRewardRuleRollupValidator {
  return new GlobalRewardRuleRollupValidator(
    [
      new GlobalRewardRuleRollupCampaignRefLengthRule(32),
      new GlobalRewardRuleRollupRevisionRangeRule(80, 3600),
      new GlobalRewardRuleRollupRequiredTitleRule("global reward rule rollup needs a value"),
      new GlobalRewardRuleRollupRequiredCampaignRefRule("global reward rule rollup needs this field"),
      new GlobalRewardRuleRollupRequiredCountryRule("global reward rule rollup needs a value"),
      new GlobalRewardRuleRollupCodeLengthRule(120),
    ],
  );
}
