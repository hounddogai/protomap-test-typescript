import { PrimaryCreditReservation } from "./primary-credit-reservation.js";

/** A rule a primary credit reservation must pass. Check returns its problems, or none. */
export interface PrimaryCreditReservationRule {
  check(item: PrimaryCreditReservation): string[];
}

export class PrimaryCreditReservationSourceLengthRule implements PrimaryCreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditReservation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreditReservationCodeLengthRule implements PrimaryCreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreditReservationRequiredCodeRule implements PrimaryCreditReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCreditReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary credit reservation. */
export class PrimaryCreditReservationValidator {
  rules: PrimaryCreditReservationRule[];

  constructor(rules: PrimaryCreditReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCreditReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCreditReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCreditReservation[]): Map<string, string[]> {
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

export function defaultPrimaryCreditReservationValidator(): PrimaryCreditReservationValidator {
  return new PrimaryCreditReservationValidator(
    [
      new PrimaryCreditReservationSourceLengthRule(1000),
      new PrimaryCreditReservationCodeLengthRule(120),
      new PrimaryCreditReservationRequiredCodeRule("primary credit reservation needs this field"),
    ],
  );
}
