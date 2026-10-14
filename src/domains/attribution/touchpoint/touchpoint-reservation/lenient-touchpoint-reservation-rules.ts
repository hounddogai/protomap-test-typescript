import { LenientTouchpointReservation } from "./lenient-touchpoint-reservation.js";

/** A rule a lenient touchpoint reservation must pass. Check returns its problems, or none. */
export interface LenientTouchpointReservationRule {
  check(item: LenientTouchpointReservation): string[];
}

export class LenientTouchpointReservationRequiredLocaleRule implements LenientTouchpointReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTouchpointReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTouchpointReservationBatchSizeRangeRule implements LenientTouchpointReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTouchpointReservation): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTouchpointReservationRequiredTitleRule implements LenientTouchpointReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTouchpointReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient touchpoint reservation. */
export class LenientTouchpointReservationValidator {
  rules: LenientTouchpointReservationRule[];

  constructor(rules: LenientTouchpointReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTouchpointReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTouchpointReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTouchpointReservation[]): Map<string, string[]> {
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

export function defaultLenientTouchpointReservationValidator(): LenientTouchpointReservationValidator {
  return new LenientTouchpointReservationValidator(
    [
      new LenientTouchpointReservationRequiredLocaleRule("lenient touchpoint reservation needs this field"),
      new LenientTouchpointReservationBatchSizeRangeRule(255, 86400),
      new LenientTouchpointReservationRequiredTitleRule("lenient touchpoint reservation needs an entry"),
    ],
  );
}
