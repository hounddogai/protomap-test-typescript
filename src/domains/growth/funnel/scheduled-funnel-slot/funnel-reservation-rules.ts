import { FunnelReservation } from "./funnel-reservation.js";

/** A rule a funnel reservation must pass. Check returns its problems, or none. */
export interface FunnelReservationRule {
  check(item: FunnelReservation): string[];
}

export class FunnelReservationNameLengthRule implements FunnelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelReservationAmountRangeRule implements FunnelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelReservation): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelReservationCodeLengthRule implements FunnelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel reservation. */
export class FunnelReservationValidator {
  rules: FunnelReservationRule[];

  constructor(rules: FunnelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelReservation[]): Map<string, string[]> {
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

export function defaultFunnelReservationValidator(): FunnelReservationValidator {
  return new FunnelReservationValidator(
    [
      new FunnelReservationNameLengthRule(64),
      new FunnelReservationAmountRangeRule(4.4, 4324.3),
      new FunnelReservationCodeLengthRule(16),
    ],
  );
}
