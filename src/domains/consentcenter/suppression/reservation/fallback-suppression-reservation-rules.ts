import * as text from "../../../../kit/text.js";
import { FallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

/** A rule a fallback suppression reservation must pass. Check returns its problems, or none. */
export interface FallbackSuppressionReservationRule {
  check(item: FallbackSuppressionReservation): string[];
}

export class FallbackSuppressionReservationAllowedUnitRule implements FallbackSuppressionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSuppressionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is unknown`];
    return [];
  }
}

export class FallbackSuppressionReservationCreatedAtRangeRule implements FallbackSuppressionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSuppressionReservation): string[] {
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

export class FallbackSuppressionReservationUnitLengthRule implements FallbackSuppressionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSuppressionReservation): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSuppressionReservationRequiredUnitRule implements FallbackSuppressionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionReservation): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSuppressionReservationOwnerIdLengthRule implements FallbackSuppressionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSuppressionReservation): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback suppression reservation. */
export class FallbackSuppressionReservationValidator {
  rules: FallbackSuppressionReservationRule[];

  constructor(rules: FallbackSuppressionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSuppressionReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSuppressionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSuppressionReservation[]): Map<string, string[]> {
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

export function defaultFallbackSuppressionReservationValidator(): FallbackSuppressionReservationValidator {
  return new FallbackSuppressionReservationValidator(
    [
      new FallbackSuppressionReservationAllowedUnitRule([]),
      new FallbackSuppressionReservationCreatedAtRangeRule(80, 120),
      new FallbackSuppressionReservationUnitLengthRule(32),
      new FallbackSuppressionReservationRequiredUnitRule("fallback suppression reservation needs an entry"),
      new FallbackSuppressionReservationOwnerIdLengthRule(80),
    ],
  );
}
