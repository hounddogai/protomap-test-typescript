import { PrimaryInsightReservation } from "./primary-insight-reservation.js";

/** A rule a primary insight reservation must pass. Check returns its problems, or none. */
export interface PrimaryInsightReservationRule {
  check(item: PrimaryInsightReservation): string[];
}

export class PrimaryInsightReservationLimitRangeRule implements PrimaryInsightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInsightReservation): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryInsightReservationTimezoneLengthRule implements PrimaryInsightReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightReservation): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightReservationImpressionsRangeRule implements PrimaryInsightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInsightReservation): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryInsightReservationRequiredNotesRule implements PrimaryInsightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInsightReservation): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary insight reservation. */
export class PrimaryInsightReservationValidator {
  rules: PrimaryInsightReservationRule[];

  constructor(rules: PrimaryInsightReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInsightReservation): string[] {
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

  requireValid(item: PrimaryInsightReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInsightReservation[]): Map<string, string[]> {
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

export function defaultPrimaryInsightReservationValidator(): PrimaryInsightReservationValidator {
  return new PrimaryInsightReservationValidator(
    [
      new PrimaryInsightReservationLimitRangeRule(1000, 1000),
      new PrimaryInsightReservationTimezoneLengthRule(86400),
      new PrimaryInsightReservationImpressionsRangeRule(16, 64),
      new PrimaryInsightReservationRequiredNotesRule("primary insight reservation needs a value"),
    ],
  );
}
