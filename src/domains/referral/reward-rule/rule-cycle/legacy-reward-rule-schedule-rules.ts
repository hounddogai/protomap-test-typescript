import { LegacyRewardRuleSchedule } from "./legacy-reward-rule-schedule.js";

/** A rule a legacy reward rule schedule must pass. Check returns its problems, or none. */
export interface LegacyRewardRuleScheduleRule {
  check(item: LegacyRewardRuleSchedule): string[];
}

export class LegacyRewardRuleScheduleCapacityRangeRule implements LegacyRewardRuleScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRewardRuleSchedule): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyRewardRuleScheduleCodeLengthRule implements LegacyRewardRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRewardRuleSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyRewardRuleScheduleRequiredCodeRule implements LegacyRewardRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy reward rule schedule. */
export class LegacyRewardRuleScheduleValidator {
  rules: LegacyRewardRuleScheduleRule[];

  constructor(rules: LegacyRewardRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRewardRuleSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyRewardRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRewardRuleSchedule[]): Map<string, string[]> {
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

export function defaultLegacyRewardRuleScheduleValidator(): LegacyRewardRuleScheduleValidator {
  return new LegacyRewardRuleScheduleValidator(
    [
      new LegacyRewardRuleScheduleCapacityRangeRule(80, 86400),
      new LegacyRewardRuleScheduleCodeLengthRule(32),
      new LegacyRewardRuleScheduleRequiredCodeRule("legacy reward rule schedule needs this field"),
    ],
  );
}
