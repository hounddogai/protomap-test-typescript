import * as text from "../../../../kit/text.js";
import { PendingConversionReservation } from "./pending-conversion-reservation.js";

/** A rule a pending conversion reservation must pass. Check returns its problems, or none. */
export interface PendingConversionReservationRule {
  check(item: PendingConversionReservation): string[];
}

export class PendingConversionReservationEndsAtRangeRule implements PendingConversionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingConversionReservation): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingConversionReservationAllowedLabelRule implements PendingConversionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingConversionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class PendingConversionReservationLabelLengthRule implements PendingConversionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingConversionReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending conversion reservation. */
export class PendingConversionReservationValidator {
  rules: PendingConversionReservationRule[];

  constructor(rules: PendingConversionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PendingConversionReservation): string[] {
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

  requireValid(item: PendingConversionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingConversionReservation[]): Map<string, string[]> {
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

export function defaultPendingConversionReservationValidator(): PendingConversionReservationValidator {
  return new PendingConversionReservationValidator(
    [
      new PendingConversionReservationEndsAtRangeRule(120, 1000),
      new PendingConversionReservationAllowedLabelRule(["default", "primary", "pending"]),
      new PendingConversionReservationLabelLengthRule(80),
    ],
  );
}
