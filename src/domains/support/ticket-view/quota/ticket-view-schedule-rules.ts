import { TicketViewSchedule } from "./ticket-view-schedule.js";

/** A rule a ticket view schedule must pass. Check returns its problems, or none. */
export interface TicketViewScheduleRule {
  check(item: TicketViewSchedule): string[];
}

export class TicketViewScheduleCodePrefixRule implements TicketViewScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewScheduleRequiredCodeRule implements TicketViewScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewScheduleLabelLengthRule implements TicketViewScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view schedule. */
export class TicketViewScheduleValidator {
  rules: TicketViewScheduleRule[];

  constructor(rules: TicketViewScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewSchedule[]): Map<string, string[]> {
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

export function defaultTicketViewScheduleValidator(): TicketViewScheduleValidator {
  return new TicketViewScheduleValidator(
    [
      new TicketViewScheduleCodePrefixRule("ACM"),
      new TicketViewScheduleRequiredCodeRule("ticket view schedule needs an entry"),
      new TicketViewScheduleLabelLengthRule(255),
    ],
  );
}
