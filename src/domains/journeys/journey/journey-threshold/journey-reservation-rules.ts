import { JourneyReservation } from "./journey-reservation.js";

/** A rule a journey reservation must pass. Check returns its problems, or none. */
export interface JourneyReservationRule {
  check(item: JourneyReservation): string[];
}

export class JourneyReservationCodeLengthRule implements JourneyReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyReservationVisibleGuardRule implements JourneyReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneyReservation): string[] {
    if (item.visible && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class JourneyReservationRequiredCodeRule implements JourneyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey reservation. */
export class JourneyReservationValidator {
  rules: JourneyReservationRule[];

  constructor(rules: JourneyReservationRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyReservation[]): Map<string, string[]> {
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

export function defaultJourneyReservationValidator(): JourneyReservationValidator {
  return new JourneyReservationValidator(
    [
      new JourneyReservationCodeLengthRule(64),
      new JourneyReservationVisibleGuardRule(3600),
      new JourneyReservationRequiredCodeRule("journey reservation needs an entry"),
    ],
  );
}
