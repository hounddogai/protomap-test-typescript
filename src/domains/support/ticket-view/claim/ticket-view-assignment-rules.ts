import { TicketViewAssignment } from "./ticket-view-assignment.js";

/** A rule a ticket view assignment must pass. Check returns its problems, or none. */
export interface TicketViewAssignmentRule {
  check(item: TicketViewAssignment): string[];
}

export class TicketViewAssignmentStartsAtRangeRule implements TicketViewAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewAssignment): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewAssignmentAudienceIdLengthRule implements TicketViewAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewAssignment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewAssignmentRequiredAudienceIdRule implements TicketViewAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewAssignment): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view assignment. */
export class TicketViewAssignmentValidator {
  rules: TicketViewAssignmentRule[];

  constructor(rules: TicketViewAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewAssignment): string[] {
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

  requireValid(item: TicketViewAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewAssignment[]): Map<string, string[]> {
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

export function defaultTicketViewAssignmentValidator(): TicketViewAssignmentValidator {
  return new TicketViewAssignmentValidator(
    [
      new TicketViewAssignmentStartsAtRangeRule(64, 1000),
      new TicketViewAssignmentAudienceIdLengthRule(32),
      new TicketViewAssignmentRequiredAudienceIdRule("ticket view assignment needs an entry"),
    ],
  );
}
