import { DoubleOptInReservation } from "./double-opt-in-reservation.js";

/** A rule a double opt in reservation must pass. Check returns its problems, or none. */
export interface DoubleOptInReservationRule {
  check(item: DoubleOptInReservation): string[];
}

export class DoubleOptInReservationThresholdRangeRule implements DoubleOptInReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInReservation): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInReservationNameLengthRule implements DoubleOptInReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInReservationWeightRangeRule implements DoubleOptInReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInReservation): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a double opt in reservation. */
export class DoubleOptInReservationValidator {
  rules: DoubleOptInReservationRule[];

  constructor(rules: DoubleOptInReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInReservation): string[] {
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

  requireValid(item: DoubleOptInReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInReservation[]): Map<string, string[]> {
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

export function defaultDoubleOptInReservationValidator(): DoubleOptInReservationValidator {
  return new DoubleOptInReservationValidator(
    [
      new DoubleOptInReservationThresholdRangeRule(1.5, 1386.6),
      new DoubleOptInReservationNameLengthRule(80),
      new DoubleOptInReservationWeightRangeRule(6.2, 3603.1),
    ],
  );
}
