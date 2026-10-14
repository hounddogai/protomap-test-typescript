import { TicketViewReservation } from "./ticket-view-reservation.js";

/** A rule a ticket view reservation must pass. Check returns its problems, or none. */
export interface TicketViewReservationRule {
  check(item: TicketViewReservation): string[];
}

export class TicketViewReservationRequiredCodeRule implements TicketViewReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewReservationCodePrefixRule implements TicketViewReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewReservationVariantLengthRule implements TicketViewReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewReservation): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view reservation. */
export class TicketViewReservationValidator {
  rules: TicketViewReservationRule[];

  constructor(rules: TicketViewReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewReservation): string[] {
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

  requireValid(item: TicketViewReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewReservation[]): Map<string, string[]> {
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

export function defaultTicketViewReservationValidator(): TicketViewReservationValidator {
  return new TicketViewReservationValidator(
    [
      new TicketViewReservationRequiredCodeRule("ticket view reservation needs an entry"),
      new TicketViewReservationCodePrefixRule("X"),
      new TicketViewReservationVariantLengthRule(64),
    ],
  );
}
