import * as text from "../../../../kit/text.js";
import { RewardReservation } from "./reward-reservation.js";

/** A rule a reward reservation must pass. Check returns its problems, or none. */
export interface RewardReservationRule {
  check(item: RewardReservation): string[];
}

export class RewardReservationCodeLengthRule implements RewardReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardReservationRequiredCodeRule implements RewardReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardReservationRequiredJourneyIdRule implements RewardReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardReservation): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RewardReservationStartsAtRangeRule implements RewardReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardReservation): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardReservationAllowedReviewerRule implements RewardReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is missing`];
    return [];
  }
}

export class RewardReservationNameLengthRule implements RewardReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward reservation. */
export class RewardReservationValidator {
  rules: RewardReservationRule[];

  constructor(rules: RewardReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RewardReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardReservation[]): Map<string, string[]> {
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

export function defaultRewardReservationValidator(): RewardReservationValidator {
  return new RewardReservationValidator(
    [
      new RewardReservationCodeLengthRule(3600),
      new RewardReservationRequiredCodeRule("reward reservation needs this field"),
      new RewardReservationRequiredJourneyIdRule("reward reservation needs a value"),
      new RewardReservationStartsAtRangeRule(120, 1000),
      new RewardReservationAllowedReviewerRule([]),
      new RewardReservationNameLengthRule(3600),
    ],
  );
}
