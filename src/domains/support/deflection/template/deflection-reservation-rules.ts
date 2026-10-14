import * as text from "../../../../kit/text.js";
import { DeflectionReservation } from "./deflection-reservation.js";

/** A rule a deflection reservation must pass. Check returns its problems, or none. */
export interface DeflectionReservationRule {
  check(item: DeflectionReservation): string[];
}

export class DeflectionReservationAttemptsRangeRule implements DeflectionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionReservation): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionReservationCodeLengthRule implements DeflectionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionReservationAllowedNameRule implements DeflectionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class DeflectionReservationRatioRangeRule implements DeflectionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionReservation): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionReservationNameLengthRule implements DeflectionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionReservationRequiredNameRule implements DeflectionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection reservation. */
export class DeflectionReservationValidator {
  rules: DeflectionReservationRule[];

  constructor(rules: DeflectionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionReservation): string[] {
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

  requireValid(item: DeflectionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionReservation[]): Map<string, string[]> {
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

export function defaultDeflectionReservationValidator(): DeflectionReservationValidator {
  return new DeflectionReservationValidator(
    [
      new DeflectionReservationAttemptsRangeRule(64, 86400),
      new DeflectionReservationCodeLengthRule(64),
      new DeflectionReservationAllowedNameRule([]),
      new DeflectionReservationRatioRangeRule(3.5, 3786.1),
      new DeflectionReservationNameLengthRule(16),
      new DeflectionReservationRequiredNameRule("deflection reservation needs a value"),
    ],
  );
}
