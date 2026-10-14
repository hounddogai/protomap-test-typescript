import { InviteReservation } from "./invite-reservation.js";

/** A rule a invite reservation must pass. Check returns its problems, or none. */
export interface InviteReservationRule {
  check(item: InviteReservation): string[];
}

export class InviteReservationRequiredExternalRefRule implements InviteReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteReservation): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class InviteReservationRequiredTitleRule implements InviteReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InviteReservationLimitRangeRule implements InviteReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteReservation): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a invite reservation. */
export class InviteReservationValidator {
  rules: InviteReservationRule[];

  constructor(rules: InviteReservationRule[]) {
    this.rules = rules;
  }

  validate(item: InviteReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteReservation[]): Map<string, string[]> {
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

export function defaultInviteReservationValidator(): InviteReservationValidator {
  return new InviteReservationValidator(
    [
      new InviteReservationRequiredExternalRefRule("invite reservation needs an entry"),
      new InviteReservationRequiredTitleRule("invite reservation needs a value"),
      new InviteReservationLimitRangeRule(3600, 86400),
    ],
  );
}
