import * as text from "../../../../kit/text.js";
import { SeasonalBidRuleSchedule } from "./seasonal-bid-rule-schedule.js";

/** A rule a seasonal bid rule schedule must pass. Check returns its problems, or none. */
export interface SeasonalBidRuleScheduleRule {
  check(item: SeasonalBidRuleSchedule): string[];
}

export class SeasonalBidRuleScheduleCodeLengthRule implements SeasonalBidRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleScheduleAllowedNameRule implements SeasonalBidRuleScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalBidRuleSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class SeasonalBidRuleScheduleRequiredSummaryRule implements SeasonalBidRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleSchedule): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBidRuleScheduleBatchSizeRangeRule implements SeasonalBidRuleScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBidRuleSchedule): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBidRuleSchedulePriorityRangeRule implements SeasonalBidRuleScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBidRuleSchedule): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal bid rule schedule. */
export class SeasonalBidRuleScheduleValidator {
  rules: SeasonalBidRuleScheduleRule[];

  constructor(rules: SeasonalBidRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBidRuleSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBidRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBidRuleSchedule[]): Map<string, string[]> {
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

export function defaultSeasonalBidRuleScheduleValidator(): SeasonalBidRuleScheduleValidator {
  return new SeasonalBidRuleScheduleValidator(
    [
      new SeasonalBidRuleScheduleCodeLengthRule(16),
      new SeasonalBidRuleScheduleAllowedNameRule(["seasonal", "manual"]),
      new SeasonalBidRuleScheduleRequiredSummaryRule("seasonal bid rule schedule needs a value"),
      new SeasonalBidRuleScheduleBatchSizeRangeRule(16, 1000),
      new SeasonalBidRuleSchedulePriorityRangeRule(32, 32),
    ],
  );
}
