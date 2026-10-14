import { PlacementReservation } from "./placement-reservation.js";

/** A rule a placement reservation must pass. Check returns its problems, or none. */
export interface PlacementReservationRule {
  check(item: PlacementReservation): string[];
}

export class PlacementReservationLabelLengthRule implements PlacementReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementReservationRequiredLabelRule implements PlacementReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementReservationCodeLengthRule implements PlacementReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementReservationActiveGuardRule implements PlacementReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementReservation): string[] {
    if (item.active && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a placement reservation. */
export class PlacementReservationValidator {
  rules: PlacementReservationRule[];

  constructor(rules: PlacementReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementReservation[]): Map<string, string[]> {
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

export function defaultPlacementReservationValidator(): PlacementReservationValidator {
  return new PlacementReservationValidator(
    [
      new PlacementReservationLabelLengthRule(255),
      new PlacementReservationRequiredLabelRule("placement reservation needs an entry"),
      new PlacementReservationCodeLengthRule(32),
      new PlacementReservationActiveGuardRule(64),
    ],
  );
}
