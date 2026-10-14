import { ChallengeReservation } from "./challenge-reservation.js";

/** A rule a challenge reservation must pass. Check returns its problems, or none. */
export interface ChallengeReservationRule {
  check(item: ChallengeReservation): string[];
}

export class ChallengeReservationAmountRangeRule implements ChallengeReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeReservation): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeReservationDurationMinutesRangeRule implements ChallengeReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeReservation): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeReservationRequiredChannelRule implements ChallengeReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeReservation): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeReservationRequiredLabelRule implements ChallengeReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge reservation. */
export class ChallengeReservationValidator {
  rules: ChallengeReservationRule[];

  constructor(rules: ChallengeReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeReservation): string[] {
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

  requireValid(item: ChallengeReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeReservation[]): Map<string, string[]> {
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

export function defaultChallengeReservationValidator(): ChallengeReservationValidator {
  return new ChallengeReservationValidator(
    [
      new ChallengeReservationAmountRangeRule(5.8, 4746.2),
      new ChallengeReservationDurationMinutesRangeRule(255, 1000),
      new ChallengeReservationRequiredChannelRule("challenge reservation needs an entry"),
      new ChallengeReservationRequiredLabelRule("challenge reservation needs a value"),
    ],
  );
}
