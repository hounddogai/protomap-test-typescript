import { TicketViewException } from "./ticket-view-exception.js";

/** A rule a ticket view exception must pass. Check returns its problems, or none. */
export interface TicketViewExceptionRule {
  check(item: TicketViewException): string[];
}

export class TicketViewExceptionRequiredAudienceIdRule implements TicketViewExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewException): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewExceptionRequiredCodeRule implements TicketViewExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewExceptionFrequencyCapRangeRule implements TicketViewExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a ticket view exception. */
export class TicketViewExceptionValidator {
  rules: TicketViewExceptionRule[];

  constructor(rules: TicketViewExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewException[]): Map<string, string[]> {
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

export function defaultTicketViewExceptionValidator(): TicketViewExceptionValidator {
  return new TicketViewExceptionValidator(
    [
      new TicketViewExceptionRequiredAudienceIdRule("ticket view exception needs a value"),
      new TicketViewExceptionRequiredCodeRule("ticket view exception needs a value"),
      new TicketViewExceptionFrequencyCapRangeRule(80, 1000),
    ],
  );
}
