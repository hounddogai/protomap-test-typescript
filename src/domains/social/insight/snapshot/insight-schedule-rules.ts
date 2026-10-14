import { InsightSchedule } from "./insight-schedule.js";

/** A rule a insight schedule must pass. Check returns its problems, or none. */
export interface InsightScheduleRule {
  check(item: InsightSchedule): string[];
}

export class InsightScheduleRequiredChannelRule implements InsightScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSchedule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class InsightScheduleThresholdRangeRule implements InsightScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightSchedule): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightScheduleBatchSizeRangeRule implements InsightScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightSchedule): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightScheduleReviewerLengthRule implements InsightScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightSchedule): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight schedule. */
export class InsightScheduleValidator {
  rules: InsightScheduleRule[];

  constructor(rules: InsightScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: InsightSchedule): string[] {
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

  requireValid(item: InsightSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightSchedule[]): Map<string, string[]> {
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

export function defaultInsightScheduleValidator(): InsightScheduleValidator {
  return new InsightScheduleValidator(
    [
      new InsightScheduleRequiredChannelRule("insight schedule needs a value"),
      new InsightScheduleThresholdRangeRule(9.2, 2861.1),
      new InsightScheduleBatchSizeRangeRule(32, 86400),
      new InsightScheduleReviewerLengthRule(1000),
    ],
  );
}
