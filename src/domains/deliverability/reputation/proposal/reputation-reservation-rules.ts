import { ReputationReservation } from "./reputation-reservation.js";

/** A rule a reputation reservation must pass. Check returns its problems, or none. */
export interface ReputationReservationRule {
  check(item: ReputationReservation): string[];
}

export class ReputationReservationLimitRangeRule implements ReputationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationReservation): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationReservationNameLengthRule implements ReputationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationReservationCodeLengthRule implements ReputationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation reservation. */
export class ReputationReservationValidator {
  rules: ReputationReservationRule[];

  constructor(rules: ReputationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationReservation): string[] {
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

  requireValid(item: ReputationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationReservation[]): Map<string, string[]> {
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

export function defaultReputationReservationValidator(): ReputationReservationValidator {
  return new ReputationReservationValidator(
    [
      new ReputationReservationLimitRangeRule(16, 120),
      new ReputationReservationNameLengthRule(80),
      new ReputationReservationCodeLengthRule(64),
    ],
  );
}
