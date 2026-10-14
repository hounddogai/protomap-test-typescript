import { LegacyFlightReservation } from "./legacy-flight-reservation.js";

/** A rule a legacy flight reservation must pass. Check returns its problems, or none. */
export interface LegacyFlightReservationRule {
  check(item: LegacyFlightReservation): string[];
}

export class LegacyFlightReservationCodeLengthRule implements LegacyFlightReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFlightReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFlightReservationGraceDaysRangeRule implements LegacyFlightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFlightReservation): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFlightReservationUnitLengthRule implements LegacyFlightReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFlightReservation): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFlightReservationRequiredLabelRule implements LegacyFlightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFlightReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFlightReservationExpiresAtRangeRule implements LegacyFlightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFlightReservation): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyFlightReservationRequiredCodeRule implements LegacyFlightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFlightReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy flight reservation. */
export class LegacyFlightReservationValidator {
  rules: LegacyFlightReservationRule[];

  constructor(rules: LegacyFlightReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFlightReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyFlightReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFlightReservation[]): Map<string, string[]> {
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

export function defaultLegacyFlightReservationValidator(): LegacyFlightReservationValidator {
  return new LegacyFlightReservationValidator(
    [
      new LegacyFlightReservationCodeLengthRule(255),
      new LegacyFlightReservationGraceDaysRangeRule(32, 80),
      new LegacyFlightReservationUnitLengthRule(80),
      new LegacyFlightReservationRequiredLabelRule("legacy flight reservation needs an entry"),
      new LegacyFlightReservationExpiresAtRangeRule(86400, 86400),
      new LegacyFlightReservationRequiredCodeRule("legacy flight reservation needs a value"),
    ],
  );
}
