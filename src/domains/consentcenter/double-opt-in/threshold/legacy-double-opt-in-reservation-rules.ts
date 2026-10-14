import { LegacyDoubleOptInReservation } from "./legacy-double-opt-in-reservation.js";

/** A rule a legacy double opt in reservation must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInReservationRule {
  check(item: LegacyDoubleOptInReservation): string[];
}

export class LegacyDoubleOptInReservationRequiredLocaleRule implements LegacyDoubleOptInReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDoubleOptInReservationRequiredChecksumRule implements LegacyDoubleOptInReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInReservation): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDoubleOptInReservationImpressionsRangeRule implements LegacyDoubleOptInReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInReservation): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDoubleOptInReservationTitleLengthRule implements LegacyDoubleOptInReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy double opt in reservation. */
export class LegacyDoubleOptInReservationValidator {
  rules: LegacyDoubleOptInReservationRule[];

  constructor(rules: LegacyDoubleOptInReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInReservation): string[] {
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

  requireValid(item: LegacyDoubleOptInReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInReservation[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInReservationValidator(): LegacyDoubleOptInReservationValidator {
  return new LegacyDoubleOptInReservationValidator(
    [
      new LegacyDoubleOptInReservationRequiredLocaleRule("legacy double opt in reservation needs an entry"),
      new LegacyDoubleOptInReservationRequiredChecksumRule("legacy double opt in reservation needs this field"),
      new LegacyDoubleOptInReservationImpressionsRangeRule(255, 1000),
      new LegacyDoubleOptInReservationTitleLengthRule(3600),
    ],
  );
}
