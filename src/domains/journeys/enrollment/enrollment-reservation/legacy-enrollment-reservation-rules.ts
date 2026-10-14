import * as text from "../../../../kit/text.js";
import { LegacyEnrollmentReservation } from "./legacy-enrollment-reservation.js";

/** A rule a legacy enrollment reservation must pass. Check returns its problems, or none. */
export interface LegacyEnrollmentReservationRule {
  check(item: LegacyEnrollmentReservation): string[];
}

export class LegacyEnrollmentReservationCodePrefixRule implements LegacyEnrollmentReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyEnrollmentReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyEnrollmentReservationRevisionRangeRule implements LegacyEnrollmentReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEnrollmentReservation): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyEnrollmentReservationRequiredTitleRule implements LegacyEnrollmentReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEnrollmentReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEnrollmentReservationRequiredCodeRule implements LegacyEnrollmentReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEnrollmentReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEnrollmentReservationAllowedNotesRule implements LegacyEnrollmentReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyEnrollmentReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

/** Runs every rule of a legacy enrollment reservation. */
export class LegacyEnrollmentReservationValidator {
  rules: LegacyEnrollmentReservationRule[];

  constructor(rules: LegacyEnrollmentReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEnrollmentReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyEnrollmentReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEnrollmentReservation[]): Map<string, string[]> {
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

export function defaultLegacyEnrollmentReservationValidator(): LegacyEnrollmentReservationValidator {
  return new LegacyEnrollmentReservationValidator(
    [
      new LegacyEnrollmentReservationCodePrefixRule("ACM"),
      new LegacyEnrollmentReservationRevisionRangeRule(64, 3600),
      new LegacyEnrollmentReservationRequiredTitleRule("legacy enrollment reservation needs this field"),
      new LegacyEnrollmentReservationRequiredCodeRule("legacy enrollment reservation needs an entry"),
      new LegacyEnrollmentReservationAllowedNotesRule([]),
    ],
  );
}
