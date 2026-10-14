import { FlightReservation } from "./flight-reservation.js";

/** A rule a flight reservation must pass. Check returns its problems, or none. */
export interface FlightReservationRule {
  check(item: FlightReservation): string[];
}

export class FlightReservationCodePrefixRule implements FlightReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightReservationRequiredLabelRule implements FlightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FlightReservationCreatedAtRangeRule implements FlightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightReservation): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a flight reservation. */
export class FlightReservationValidator {
  rules: FlightReservationRule[];

  constructor(rules: FlightReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FlightReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightReservation[]): Map<string, string[]> {
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

export function defaultFlightReservationValidator(): FlightReservationValidator {
  return new FlightReservationValidator(
    [
      new FlightReservationCodePrefixRule("REF"),
      new FlightReservationRequiredLabelRule("flight reservation needs this field"),
      new FlightReservationCreatedAtRangeRule(64, 80),
    ],
  );
}
