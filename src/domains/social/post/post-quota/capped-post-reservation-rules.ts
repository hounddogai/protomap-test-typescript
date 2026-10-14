import * as text from "../../../../kit/text.js";
import { CappedPostReservation } from "./capped-post-reservation.js";

/** A rule a capped post reservation must pass. Check returns its problems, or none. */
export interface CappedPostReservationRule {
  check(item: CappedPostReservation): string[];
}

export class CappedPostReservationImpressionsRangeRule implements CappedPostReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPostReservation): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPostReservationAllowedUnitRule implements CappedPostReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedPostReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is above maximum`];
    return [];
  }
}

export class CappedPostReservationRequiredLabelRule implements CappedPostReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPostReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPostReservationWindowDaysRangeRule implements CappedPostReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPostReservation): string[] {
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

export class CappedPostReservationCountryLengthRule implements CappedPostReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPostReservation): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped post reservation. */
export class CappedPostReservationValidator {
  rules: CappedPostReservationRule[];

  constructor(rules: CappedPostReservationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPostReservation): string[] {
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

  requireValid(item: CappedPostReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPostReservation[]): Map<string, string[]> {
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

export function defaultCappedPostReservationValidator(): CappedPostReservationValidator {
  return new CappedPostReservationValidator(
    [
      new CappedPostReservationImpressionsRangeRule(16, 120),
      new CappedPostReservationAllowedUnitRule(["legacy", "batched"]),
      new CappedPostReservationRequiredLabelRule("capped post reservation needs an entry"),
      new CappedPostReservationWindowDaysRangeRule(32, 3600),
      new CappedPostReservationCountryLengthRule(86400),
    ],
  );
}
