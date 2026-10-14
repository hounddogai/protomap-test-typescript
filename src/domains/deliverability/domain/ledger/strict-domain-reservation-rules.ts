import { StrictDomainReservation } from "./strict-domain-reservation.js";

/** A rule a strict domain reservation must pass. Check returns its problems, or none. */
export interface StrictDomainReservationRule {
  check(item: StrictDomainReservation): string[];
}

export class StrictDomainReservationLabelLengthRule implements StrictDomainReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainReservationRequiredCodeRule implements StrictDomainReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDomainReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDomainReservationScoreRangeRule implements StrictDomainReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictDomainReservation): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict domain reservation. */
export class StrictDomainReservationValidator {
  rules: StrictDomainReservationRule[];

  constructor(rules: StrictDomainReservationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDomainReservation): string[] {
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

  requireValid(item: StrictDomainReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDomainReservation[]): Map<string, string[]> {
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

export function defaultStrictDomainReservationValidator(): StrictDomainReservationValidator {
  return new StrictDomainReservationValidator(
    [
      new StrictDomainReservationLabelLengthRule(255),
      new StrictDomainReservationRequiredCodeRule("strict domain reservation needs an entry"),
      new StrictDomainReservationScoreRangeRule(1.2, 1054.4),
    ],
  );
}
