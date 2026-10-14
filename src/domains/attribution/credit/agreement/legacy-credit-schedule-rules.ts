import * as text from "../../../../kit/text.js";
import { LegacyCreditSchedule } from "./legacy-credit-schedule.js";

/** A rule a legacy credit schedule must pass. Check returns its problems, or none. */
export interface LegacyCreditScheduleRule {
  check(item: LegacyCreditSchedule): string[];
}

export class LegacyCreditScheduleAllowedCodeRule implements LegacyCreditScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyCreditSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class LegacyCreditScheduleRequiredLabelRule implements LegacyCreditScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreditSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCreditScheduleGraceDaysRangeRule implements LegacyCreditScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreditSchedule): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy credit schedule. */
export class LegacyCreditScheduleValidator {
  rules: LegacyCreditScheduleRule[];

  constructor(rules: LegacyCreditScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCreditSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyCreditSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCreditSchedule[]): Map<string, string[]> {
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

export function defaultLegacyCreditScheduleValidator(): LegacyCreditScheduleValidator {
  return new LegacyCreditScheduleValidator(
    [
      new LegacyCreditScheduleAllowedCodeRule(["seasonal"]),
      new LegacyCreditScheduleRequiredLabelRule("legacy credit schedule needs a value"),
      new LegacyCreditScheduleGraceDaysRangeRule(16, 120),
    ],
  );
}
