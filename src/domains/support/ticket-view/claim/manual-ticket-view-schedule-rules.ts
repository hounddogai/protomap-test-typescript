import * as text from "../../../../kit/text.js";
import { ManualTicketViewSchedule } from "./manual-ticket-view-schedule.js";

/** A rule a manual ticket view schedule must pass. Check returns its problems, or none. */
export interface ManualTicketViewScheduleRule {
  check(item: ManualTicketViewSchedule): string[];
}

export class ManualTicketViewScheduleAllowedTitleRule implements ManualTicketViewScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTicketViewSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class ManualTicketViewScheduleVariantLengthRule implements ManualTicketViewScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewSchedule): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTicketViewScheduleRequiredVariantRule implements ManualTicketViewScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewSchedule): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTicketViewScheduleStartsAtRangeRule implements ManualTicketViewScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTicketViewSchedule): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual ticket view schedule. */
export class ManualTicketViewScheduleValidator {
  rules: ManualTicketViewScheduleRule[];

  constructor(rules: ManualTicketViewScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTicketViewSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTicketViewSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTicketViewSchedule[]): Map<string, string[]> {
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

export function defaultManualTicketViewScheduleValidator(): ManualTicketViewScheduleValidator {
  return new ManualTicketViewScheduleValidator(
    [
      new ManualTicketViewScheduleAllowedTitleRule(["manual", "global", "batched"]),
      new ManualTicketViewScheduleVariantLengthRule(3600),
      new ManualTicketViewScheduleRequiredVariantRule("manual ticket view schedule needs a value"),
      new ManualTicketViewScheduleStartsAtRangeRule(16, 64),
    ],
  );
}
