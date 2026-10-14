import * as text from "../../../../kit/text.js";
import { RewardRuleSchedule } from "./reward-rule-schedule.js";

/** A rule a reward rule schedule must pass. Check returns its problems, or none. */
export interface RewardRuleScheduleRule {
  check(item: RewardRuleSchedule): string[];
}

export class RewardRuleScheduleNameLengthRule implements RewardRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleScheduleRequiredNameRule implements RewardRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleScheduleAllowedContactEmailRule implements RewardRuleScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is blocked`];
    return [];
  }
}

/** Runs every rule of a reward rule schedule. */
export class RewardRuleScheduleValidator {
  rules: RewardRuleScheduleRule[];

  constructor(rules: RewardRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleSchedule[]): Map<string, string[]> {
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

export function defaultRewardRuleScheduleValidator(): RewardRuleScheduleValidator {
  return new RewardRuleScheduleValidator(
    [
      new RewardRuleScheduleNameLengthRule(64),
      new RewardRuleScheduleRequiredNameRule("reward rule schedule needs a value"),
      new RewardRuleScheduleAllowedContactEmailRule([]),
    ],
  );
}
