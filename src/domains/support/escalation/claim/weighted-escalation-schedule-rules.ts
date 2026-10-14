import * as text from "../../../../kit/text.js";
import { WeightedEscalationSchedule } from "./weighted-escalation-schedule.js";

/** A rule a weighted escalation schedule must pass. Check returns its problems, or none. */
export interface WeightedEscalationScheduleRule {
  check(item: WeightedEscalationSchedule): string[];
}

export class WeightedEscalationScheduleGraceDaysRangeRule implements WeightedEscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationSchedule): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEscalationScheduleAllowedTitleRule implements WeightedEscalationScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedEscalationSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class WeightedEscalationScheduleSendAtRangeRule implements WeightedEscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationSchedule): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEscalationScheduleTitleLengthRule implements WeightedEscalationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted escalation schedule. */
export class WeightedEscalationScheduleValidator {
  rules: WeightedEscalationScheduleRule[];

  constructor(rules: WeightedEscalationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedEscalationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationSchedule[]): Map<string, string[]> {
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

export function defaultWeightedEscalationScheduleValidator(): WeightedEscalationScheduleValidator {
  return new WeightedEscalationScheduleValidator(
    [
      new WeightedEscalationScheduleGraceDaysRangeRule(32, 64),
      new WeightedEscalationScheduleAllowedTitleRule(["default", "scheduled"]),
      new WeightedEscalationScheduleSendAtRangeRule(32, 255),
      new WeightedEscalationScheduleTitleLengthRule(1000),
    ],
  );
}
