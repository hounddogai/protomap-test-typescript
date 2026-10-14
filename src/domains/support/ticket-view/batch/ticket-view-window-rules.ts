import { TicketViewWindow } from "./ticket-view-window.js";

/** A rule a ticket view window must pass. Check returns its problems, or none. */
export interface TicketViewWindowRule {
  check(item: TicketViewWindow): string[];
}

export class TicketViewWindowJourneyIdLengthRule implements TicketViewWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewWindow): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewWindowDurationMinutesRangeRule implements TicketViewWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewWindow): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewWindowEndsAtRangeRule implements TicketViewWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewWindow): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a ticket view window. */
export class TicketViewWindowValidator {
  rules: TicketViewWindowRule[];

  constructor(rules: TicketViewWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewWindow): string[] {
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

  requireValid(item: TicketViewWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewWindow[]): Map<string, string[]> {
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

export function defaultTicketViewWindowValidator(): TicketViewWindowValidator {
  return new TicketViewWindowValidator(
    [
      new TicketViewWindowJourneyIdLengthRule(64),
      new TicketViewWindowDurationMinutesRangeRule(120, 1000),
      new TicketViewWindowEndsAtRangeRule(16, 86400),
    ],
  );
}
