import { RegionalChallengeReservation } from "./regional-challenge-reservation.js";

/** A rule a regional challenge reservation must pass. Check returns its problems, or none. */
export interface RegionalChallengeReservationRule {
  check(item: RegionalChallengeReservation): string[];
}

export class RegionalChallengeReservationCodePrefixRule implements RegionalChallengeReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalChallengeReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalChallengeReservationWindowDaysRangeRule implements RegionalChallengeReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalChallengeReservation): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalChallengeReservationSummaryLengthRule implements RegionalChallengeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeReservation): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeReservationRequiredCodeRule implements RegionalChallengeReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional challenge reservation. */
export class RegionalChallengeReservationValidator {
  rules: RegionalChallengeReservationRule[];

  constructor(rules: RegionalChallengeReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalChallengeReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalChallengeReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalChallengeReservation[]): Map<string, string[]> {
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

export function defaultRegionalChallengeReservationValidator(): RegionalChallengeReservationValidator {
  return new RegionalChallengeReservationValidator(
    [
      new RegionalChallengeReservationCodePrefixRule("REF"),
      new RegionalChallengeReservationWindowDaysRangeRule(120, 1000),
      new RegionalChallengeReservationSummaryLengthRule(16),
      new RegionalChallengeReservationRequiredCodeRule("regional challenge reservation needs this field"),
    ],
  );
}
