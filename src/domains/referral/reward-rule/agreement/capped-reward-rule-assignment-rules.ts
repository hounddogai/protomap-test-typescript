import * as text from "../../../../kit/text.js";
import { CappedRewardRuleAssignment } from "./capped-reward-rule-assignment.js";

/** A rule a capped reward rule assignment must pass. Check returns its problems, or none. */
export interface CappedRewardRuleAssignmentRule {
  check(item: CappedRewardRuleAssignment): string[];
}

export class CappedRewardRuleAssignmentAllowedJourneyIdRule implements CappedRewardRuleAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedRewardRuleAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is duplicated`];
    return [];
  }
}

export class CappedRewardRuleAssignmentCodePrefixRule implements CappedRewardRuleAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedRewardRuleAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedRewardRuleAssignmentJourneyIdLengthRule implements CappedRewardRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRewardRuleAssignment): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRewardRuleAssignmentCostRangeRule implements CappedRewardRuleAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRewardRuleAssignment): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedRewardRuleAssignmentRequiredJourneyIdRule implements CappedRewardRuleAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRewardRuleAssignment): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped reward rule assignment. */
export class CappedRewardRuleAssignmentValidator {
  rules: CappedRewardRuleAssignmentRule[];

  constructor(rules: CappedRewardRuleAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRewardRuleAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedRewardRuleAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRewardRuleAssignment[]): Map<string, string[]> {
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

export function defaultCappedRewardRuleAssignmentValidator(): CappedRewardRuleAssignmentValidator {
  return new CappedRewardRuleAssignmentValidator(
    [
      new CappedRewardRuleAssignmentAllowedJourneyIdRule(["global", "fallback"]),
      new CappedRewardRuleAssignmentCodePrefixRule("Q"),
      new CappedRewardRuleAssignmentJourneyIdLengthRule(255),
      new CappedRewardRuleAssignmentCostRangeRule(1, 4573),
      new CappedRewardRuleAssignmentRequiredJourneyIdRule("capped reward rule assignment needs this field"),
    ],
  );
}
