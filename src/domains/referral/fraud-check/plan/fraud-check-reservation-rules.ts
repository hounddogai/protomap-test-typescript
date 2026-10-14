import { FraudCheckReservation } from "./fraud-check-reservation.js";

/** A rule a fraud check reservation must pass. Check returns its problems, or none. */
export interface FraudCheckReservationRule {
  check(item: FraudCheckReservation): string[];
}

export class FraudCheckReservationDurationMinutesRangeRule implements FraudCheckReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckReservation): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckReservationNotesLengthRule implements FraudCheckReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckReservation): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckReservationDiscountRangeRule implements FraudCheckReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckReservation): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fraud check reservation. */
export class FraudCheckReservationValidator {
  rules: FraudCheckReservationRule[];

  constructor(rules: FraudCheckReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckReservation): string[] {
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

  requireValid(item: FraudCheckReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckReservation[]): Map<string, string[]> {
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

export function defaultFraudCheckReservationValidator(): FraudCheckReservationValidator {
  return new FraudCheckReservationValidator(
    [
      new FraudCheckReservationDurationMinutesRangeRule(1000, 3600),
      new FraudCheckReservationNotesLengthRule(32),
      new FraudCheckReservationDiscountRangeRule(3.7, 797.2),
    ],
  );
}
