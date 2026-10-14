import * as text from "../../../../kit/text.js";
import { DoubleOptInSchedule } from "./double-opt-in-schedule.js";

/** A rule a double opt in schedule must pass. Check returns its problems, or none. */
export interface DoubleOptInScheduleRule {
  check(item: DoubleOptInSchedule): string[];
}

export class DoubleOptInScheduleRequiredCodeRule implements DoubleOptInScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInScheduleAllowedOwnerIdRule implements DoubleOptInScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is out of range`];
    return [];
  }
}

export class DoubleOptInScheduleRequiredTitleRule implements DoubleOptInScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInScheduleRequiredLabelRule implements DoubleOptInScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in schedule. */
export class DoubleOptInScheduleValidator {
  rules: DoubleOptInScheduleRule[];

  constructor(rules: DoubleOptInScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInSchedule[]): Map<string, string[]> {
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

export function defaultDoubleOptInScheduleValidator(): DoubleOptInScheduleValidator {
  return new DoubleOptInScheduleValidator(
    [
      new DoubleOptInScheduleRequiredCodeRule("double opt in schedule needs this field"),
      new DoubleOptInScheduleAllowedOwnerIdRule(["global", "default", "primary"]),
      new DoubleOptInScheduleRequiredTitleRule("double opt in schedule needs this field"),
      new DoubleOptInScheduleRequiredLabelRule("double opt in schedule needs a value"),
    ],
  );
}
