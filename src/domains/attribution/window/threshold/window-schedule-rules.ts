import * as text from "../../../../kit/text.js";
import { WindowSchedule } from "./window-schedule.js";

/** A rule a window schedule must pass. Check returns its problems, or none. */
export interface WindowScheduleRule {
  check(item: WindowSchedule): string[];
}

export class WindowScheduleMarginRangeRule implements WindowScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSchedule): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowScheduleAllowedCodeRule implements WindowScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class WindowScheduleRequiredCodeRule implements WindowScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowScheduleGraceDaysRangeRule implements WindowScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSchedule): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a window schedule. */
export class WindowScheduleValidator {
  rules: WindowScheduleRule[];

  constructor(rules: WindowScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WindowSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowSchedule[]): Map<string, string[]> {
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

export function defaultWindowScheduleValidator(): WindowScheduleValidator {
  return new WindowScheduleValidator(
    [
      new WindowScheduleMarginRangeRule(7.6, 4067.8),
      new WindowScheduleAllowedCodeRule(["fallback"]),
      new WindowScheduleRequiredCodeRule("window schedule needs an entry"),
      new WindowScheduleGraceDaysRangeRule(80, 120),
    ],
  );
}
