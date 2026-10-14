import { CreditReservation } from "./credit-reservation.js";

/** A rule a credit reservation must pass. Check returns its problems, or none. */
export interface CreditReservationRule {
  check(item: CreditReservation): string[];
}

export class CreditReservationMinimumRangeRule implements CreditReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditReservation): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditReservationRequiredReviewerRule implements CreditReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditReservation): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class CreditReservationStartsAtRangeRule implements CreditReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditReservation): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditReservationExternalRefLengthRule implements CreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditReservation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditReservationTitleLengthRule implements CreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditReservationCodeLengthRule implements CreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit reservation. */
export class CreditReservationValidator {
  rules: CreditReservationRule[];

  constructor(rules: CreditReservationRule[]) {
    this.rules = rules;
  }

  validate(item: CreditReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditReservation[]): Map<string, string[]> {
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

export function defaultCreditReservationValidator(): CreditReservationValidator {
  return new CreditReservationValidator(
    [
      new CreditReservationMinimumRangeRule(9.5, 1257.6),
      new CreditReservationRequiredReviewerRule("credit reservation needs this field"),
      new CreditReservationStartsAtRangeRule(64, 1000),
      new CreditReservationExternalRefLengthRule(80),
      new CreditReservationTitleLengthRule(3600),
      new CreditReservationCodeLengthRule(120),
    ],
  );
}
