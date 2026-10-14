import { WindowReservation } from "./window-reservation.js";

/** A rule a window reservation must pass. Check returns its problems, or none. */
export interface WindowReservationRule {
  check(item: WindowReservation): string[];
}

export class WindowReservationLabelLengthRule implements WindowReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowReservationRequiredCodeRule implements WindowReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowReservationAudienceIdLengthRule implements WindowReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowReservation): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowReservationQuantityRangeRule implements WindowReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowReservation): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a window reservation. */
export class WindowReservationValidator {
  rules: WindowReservationRule[];

  constructor(rules: WindowReservationRule[]) {
    this.rules = rules;
  }

  validate(item: WindowReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowReservation[]): Map<string, string[]> {
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

export function defaultWindowReservationValidator(): WindowReservationValidator {
  return new WindowReservationValidator(
    [
      new WindowReservationLabelLengthRule(255),
      new WindowReservationRequiredCodeRule("window reservation needs a value"),
      new WindowReservationAudienceIdLengthRule(1000),
      new WindowReservationQuantityRangeRule(120, 3600),
    ],
  );
}
