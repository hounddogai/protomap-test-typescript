import { BounceReservation } from "./bounce-reservation.js";

/** A rule a bounce reservation must pass. Check returns its problems, or none. */
export interface BounceReservationRule {
  check(item: BounceReservation): string[];
}

export class BounceReservationGraceDaysRangeRule implements BounceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceReservation): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceReservationScoreRangeRule implements BounceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceReservation): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceReservationCurrencyLengthRule implements BounceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceReservation): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce reservation. */
export class BounceReservationValidator {
  rules: BounceReservationRule[];

  constructor(rules: BounceReservationRule[]) {
    this.rules = rules;
  }

  validate(item: BounceReservation): string[] {
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

  requireValid(item: BounceReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceReservation[]): Map<string, string[]> {
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

export function defaultBounceReservationValidator(): BounceReservationValidator {
  return new BounceReservationValidator(
    [
      new BounceReservationGraceDaysRangeRule(32, 86400),
      new BounceReservationScoreRangeRule(2.6, 3064.3),
      new BounceReservationCurrencyLengthRule(120),
    ],
  );
}
