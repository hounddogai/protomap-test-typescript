import { ScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

/** A rule a scheduled conversion reservation must pass. Check returns its problems, or none. */
export interface ScheduledConversionReservationRule {
  check(item: ScheduledConversionReservation): string[];
}

export class ScheduledConversionReservationRequiredCodeRule implements ScheduledConversionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledConversionReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledConversionReservationCapacityRangeRule implements ScheduledConversionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledConversionReservation): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledConversionReservationRequiredContactEmailRule implements ScheduledConversionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledConversionReservation): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledConversionReservationRequiredLabelRule implements ScheduledConversionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledConversionReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled conversion reservation. */
export class ScheduledConversionReservationValidator {
  rules: ScheduledConversionReservationRule[];

  constructor(rules: ScheduledConversionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledConversionReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledConversionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledConversionReservation[]): Map<string, string[]> {
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

export function defaultScheduledConversionReservationValidator(): ScheduledConversionReservationValidator {
  return new ScheduledConversionReservationValidator(
    [
      new ScheduledConversionReservationRequiredCodeRule("scheduled conversion reservation needs an entry"),
      new ScheduledConversionReservationCapacityRangeRule(1000, 1000),
      new ScheduledConversionReservationRequiredContactEmailRule(
        "scheduled conversion reservation needs this field",
      ),
      new ScheduledConversionReservationRequiredLabelRule("scheduled conversion reservation needs this field"),
    ],
  );
}
