import { PayoutReservation } from "./payout-reservation.js";

/** A rule a payout reservation must pass. Check returns its problems, or none. */
export interface PayoutReservationRule {
  check(item: PayoutReservation): string[];
}

export class PayoutReservationRequiredTitleRule implements PayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutReservationLocaleLengthRule implements PayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutReservation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutReservationAudienceIdLengthRule implements PayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutReservation): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutReservationRequiredLocaleRule implements PayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutReservationCreatedAtRangeRule implements PayoutReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutReservation): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutReservationRequiredCodeRule implements PayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout reservation. */
export class PayoutReservationValidator {
  rules: PayoutReservationRule[];

  constructor(rules: PayoutReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutReservation): string[] {
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

  requireValid(item: PayoutReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutReservation[]): Map<string, string[]> {
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

export function defaultPayoutReservationValidator(): PayoutReservationValidator {
  return new PayoutReservationValidator(
    [
      new PayoutReservationRequiredTitleRule("payout reservation needs an entry"),
      new PayoutReservationLocaleLengthRule(86400),
      new PayoutReservationAudienceIdLengthRule(86400),
      new PayoutReservationRequiredLocaleRule("payout reservation needs an entry"),
      new PayoutReservationCreatedAtRangeRule(255, 255),
      new PayoutReservationRequiredCodeRule("payout reservation needs a value"),
    ],
  );
}
