import * as text from "../../../../kit/text.js";
import { SeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

/** A rule a seasonal insight schedule must pass. Check returns its problems, or none. */
export interface SeasonalInsightScheduleRule {
  check(item: SeasonalInsightSchedule): string[];
}

export class SeasonalInsightScheduleCodeLengthRule implements SeasonalInsightScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInsightSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInsightScheduleBatchSizeRangeRule implements SeasonalInsightScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInsightSchedule): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalInsightScheduleAllowedNameRule implements SeasonalInsightScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalInsightSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

/** Runs every rule of a seasonal insight schedule. */
export class SeasonalInsightScheduleValidator {
  rules: SeasonalInsightScheduleRule[];

  constructor(rules: SeasonalInsightScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInsightSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalInsightSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInsightSchedule[]): Map<string, string[]> {
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

export function defaultSeasonalInsightScheduleValidator(): SeasonalInsightScheduleValidator {
  return new SeasonalInsightScheduleValidator(
    [
      new SeasonalInsightScheduleCodeLengthRule(1000),
      new SeasonalInsightScheduleBatchSizeRangeRule(64, 1000),
      new SeasonalInsightScheduleAllowedNameRule(["adaptive", "fallback", "regional"]),
    ],
  );
}
