import { RegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

/** A rule a regional subscription reservation must pass. Check returns its problems, or none. */
export interface RegionalSubscriptionReservationRule {
  check(item: RegionalSubscriptionReservation): string[];
}

export class RegionalSubscriptionReservationRequiredCodeRule implements RegionalSubscriptionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSubscriptionReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSubscriptionReservationBidRangeRule implements RegionalSubscriptionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSubscriptionReservation): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalSubscriptionReservationCodeLengthRule implements RegionalSubscriptionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSubscriptionReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSubscriptionReservationSummaryLengthRule implements RegionalSubscriptionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSubscriptionReservation): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional subscription reservation. */
export class RegionalSubscriptionReservationValidator {
  rules: RegionalSubscriptionReservationRule[];

  constructor(rules: RegionalSubscriptionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSubscriptionReservation): string[] {
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

  requireValid(item: RegionalSubscriptionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSubscriptionReservation[]): Map<string, string[]> {
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

export function defaultRegionalSubscriptionReservationValidator(): RegionalSubscriptionReservationValidator {
  return new RegionalSubscriptionReservationValidator(
    [
      new RegionalSubscriptionReservationRequiredCodeRule("regional subscription reservation needs an entry"),
      new RegionalSubscriptionReservationBidRangeRule(4.7, 2479.1),
      new RegionalSubscriptionReservationCodeLengthRule(32),
      new RegionalSubscriptionReservationSummaryLengthRule(120),
    ],
  );
}
