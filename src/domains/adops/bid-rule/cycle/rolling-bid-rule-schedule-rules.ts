import { RollingBidRuleSchedule } from "./rolling-bid-rule-schedule.js";

/** A rule a rolling bid rule schedule must pass. Check returns its problems, or none. */
export interface RollingBidRuleScheduleRule {
  check(item: RollingBidRuleSchedule): string[];
}

export class RollingBidRuleScheduleCodeLengthRule implements RollingBidRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleScheduleCategoryLengthRule implements RollingBidRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleSchedule): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleScheduleNameLengthRule implements RollingBidRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling bid rule schedule. */
export class RollingBidRuleScheduleValidator {
  rules: RollingBidRuleScheduleRule[];

  constructor(rules: RollingBidRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBidRuleSchedule): string[] {
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

  requireValid(item: RollingBidRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBidRuleSchedule[]): Map<string, string[]> {
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

export function defaultRollingBidRuleScheduleValidator(): RollingBidRuleScheduleValidator {
  return new RollingBidRuleScheduleValidator(
    [
      new RollingBidRuleScheduleCodeLengthRule(80),
      new RollingBidRuleScheduleCategoryLengthRule(86400),
      new RollingBidRuleScheduleNameLengthRule(16),
    ],
  );
}
