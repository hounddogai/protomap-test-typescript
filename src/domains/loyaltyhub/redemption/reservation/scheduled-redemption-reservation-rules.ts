import { ScheduledRedemptionReservation } from "./scheduled-redemption-reservation.js";

/** A rule a scheduled redemption reservation must pass. Check returns its problems, or none. */
export interface ScheduledRedemptionReservationRule {
  check(item: ScheduledRedemptionReservation): string[];
}

export class ScheduledRedemptionReservationRequiredCodeRule implements ScheduledRedemptionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRedemptionReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRedemptionReservationNameLengthRule implements ScheduledRedemptionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRedemptionReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRedemptionReservationRequiredNameRule implements ScheduledRedemptionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRedemptionReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled redemption reservation. */
export class ScheduledRedemptionReservationValidator {
  rules: ScheduledRedemptionReservationRule[];

  constructor(rules: ScheduledRedemptionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRedemptionReservation): string[] {
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

  requireValid(item: ScheduledRedemptionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRedemptionReservation[]): Map<string, string[]> {
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

export function defaultScheduledRedemptionReservationValidator(): ScheduledRedemptionReservationValidator {
  return new ScheduledRedemptionReservationValidator(
    [
      new ScheduledRedemptionReservationRequiredCodeRule("scheduled redemption reservation needs this field"),
      new ScheduledRedemptionReservationNameLengthRule(120),
      new ScheduledRedemptionReservationRequiredNameRule("scheduled redemption reservation needs this field"),
    ],
  );
}
