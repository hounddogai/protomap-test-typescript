import { LegacyWindowReservation } from "./legacy-window-reservation.js";

/** A rule a legacy window reservation must pass. Check returns its problems, or none. */
export interface LegacyWindowReservationRule {
  check(item: LegacyWindowReservation): string[];
}

export class LegacyWindowReservationReviewerLengthRule implements LegacyWindowReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowReservation): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWindowReservationNotesLengthRule implements LegacyWindowReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowReservation): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWindowReservationScoreRangeRule implements LegacyWindowReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWindowReservation): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyWindowReservationImpressionsRangeRule implements LegacyWindowReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWindowReservation): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyWindowReservationCodePrefixRule implements LegacyWindowReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyWindowReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyWindowReservationRequiredCodeRule implements LegacyWindowReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWindowReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy window reservation. */
export class LegacyWindowReservationValidator {
  rules: LegacyWindowReservationRule[];

  constructor(rules: LegacyWindowReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWindowReservation): string[] {
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

  requireValid(item: LegacyWindowReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWindowReservation[]): Map<string, string[]> {
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

export function defaultLegacyWindowReservationValidator(): LegacyWindowReservationValidator {
  return new LegacyWindowReservationValidator(
    [
      new LegacyWindowReservationReviewerLengthRule(64),
      new LegacyWindowReservationNotesLengthRule(64),
      new LegacyWindowReservationScoreRangeRule(9, 1682.6),
      new LegacyWindowReservationImpressionsRangeRule(80, 255),
      new LegacyWindowReservationCodePrefixRule("REF"),
      new LegacyWindowReservationRequiredCodeRule("legacy window reservation needs an entry"),
    ],
  );
}
