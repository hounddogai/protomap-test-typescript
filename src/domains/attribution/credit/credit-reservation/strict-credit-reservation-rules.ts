import { StrictCreditReservation } from "./strict-credit-reservation.js";

/** A rule a strict credit reservation must pass. Check returns its problems, or none. */
export interface StrictCreditReservationRule {
  check(item: StrictCreditReservation): string[];
}

export class StrictCreditReservationNameLengthRule implements StrictCreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreditReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreditReservationRequiredLocaleRule implements StrictCreditReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreditReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreditReservationRequiredLabelRule implements StrictCreditReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreditReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreditReservationApprovedGuardRule implements StrictCreditReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictCreditReservation): string[] {
    if (item.approved && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a strict credit reservation. */
export class StrictCreditReservationValidator {
  rules: StrictCreditReservationRule[];

  constructor(rules: StrictCreditReservationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreditReservation): string[] {
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

  requireValid(item: StrictCreditReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreditReservation[]): Map<string, string[]> {
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

export function defaultStrictCreditReservationValidator(): StrictCreditReservationValidator {
  return new StrictCreditReservationValidator(
    [
      new StrictCreditReservationNameLengthRule(255),
      new StrictCreditReservationRequiredLocaleRule("strict credit reservation needs an entry"),
      new StrictCreditReservationRequiredLabelRule("strict credit reservation needs a value"),
      new StrictCreditReservationApprovedGuardRule(32),
    ],
  );
}
