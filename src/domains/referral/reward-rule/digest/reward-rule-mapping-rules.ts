import * as text from "../../../../kit/text.js";
import { RewardRuleMapping } from "./reward-rule-mapping.js";

/** A rule a reward rule mapping must pass. Check returns its problems, or none. */
export interface RewardRuleMappingRule {
  check(item: RewardRuleMapping): string[];
}

export class RewardRuleMappingAllowedCategoryRule implements RewardRuleMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is not allowed`];
    return [];
  }
}

export class RewardRuleMappingRequiredNotesRule implements RewardRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleMapping): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleMappingStartsAtRangeRule implements RewardRuleMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleMapping): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleMappingRequiredCategoryRule implements RewardRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleMapping): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleMappingCodeLengthRule implements RewardRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleMappingWindowRule implements RewardRuleMappingRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: RewardRuleMapping): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

/** Runs every rule of a reward rule mapping. */
export class RewardRuleMappingValidator {
  rules: RewardRuleMappingRule[];

  constructor(rules: RewardRuleMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleMapping[]): Map<string, string[]> {
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

export function defaultRewardRuleMappingValidator(): RewardRuleMappingValidator {
  return new RewardRuleMappingValidator(
    [
      new RewardRuleMappingAllowedCategoryRule(["tiered", "primary", "pending"]),
      new RewardRuleMappingRequiredNotesRule("reward rule mapping needs this field"),
      new RewardRuleMappingStartsAtRangeRule(255, 86400),
      new RewardRuleMappingRequiredCategoryRule("reward rule mapping needs a value"),
      new RewardRuleMappingCodeLengthRule(80),
      new RewardRuleMappingWindowRule(255),
    ],
  );
}
