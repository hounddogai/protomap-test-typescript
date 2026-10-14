import { SenderReservation } from "./sender-reservation.js";

/** A rule a sender reservation must pass. Check returns its problems, or none. */
export interface SenderReservationRule {
  check(item: SenderReservation): string[];
}

export class SenderReservationQuantityRangeRule implements SenderReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderReservation): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderReservationLabelLengthRule implements SenderReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderReservationRequiredLabelRule implements SenderReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SenderReservationRequiredExternalRefRule implements SenderReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderReservation): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class SenderReservationExternalRefLengthRule implements SenderReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderReservation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderReservationRequiredCodeRule implements SenderReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender reservation. */
export class SenderReservationValidator {
  rules: SenderReservationRule[];

  constructor(rules: SenderReservationRule[]) {
    this.rules = rules;
  }

  validate(item: SenderReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderReservation[]): Map<string, string[]> {
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

export function defaultSenderReservationValidator(): SenderReservationValidator {
  return new SenderReservationValidator(
    [
      new SenderReservationQuantityRangeRule(64, 1000),
      new SenderReservationLabelLengthRule(255),
      new SenderReservationRequiredLabelRule("sender reservation needs a value"),
      new SenderReservationRequiredExternalRefRule("sender reservation needs a value"),
      new SenderReservationExternalRefLengthRule(120),
      new SenderReservationRequiredCodeRule("sender reservation needs an entry"),
    ],
  );
}
