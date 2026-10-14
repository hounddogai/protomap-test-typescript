import * as text from "../../../../kit/text.js";
import { PacingReservation } from "./pacing-reservation.js";

/** A rule a pacing reservation must pass. Check returns its problems, or none. */
export interface PacingReservationRule {
  check(item: PacingReservation): string[];
}

export class PacingReservationAllowedRegionRule implements PacingReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is inconsistent`];
    return [];
  }
}

export class PacingReservationVisibleGuardRule implements PacingReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingReservation): string[] {
    if (item.visible && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PacingReservationRequiredSummaryRule implements PacingReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingReservation): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PacingReservationRequiredRegionRule implements PacingReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingReservation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PacingReservationRegionLengthRule implements PacingReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingReservation): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing reservation. */
export class PacingReservationValidator {
  rules: PacingReservationRule[];

  constructor(rules: PacingReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PacingReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingReservation[]): Map<string, string[]> {
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

export function defaultPacingReservationValidator(): PacingReservationValidator {
  return new PacingReservationValidator(
    [
      new PacingReservationAllowedRegionRule([]),
      new PacingReservationVisibleGuardRule(80),
      new PacingReservationRequiredSummaryRule("pacing reservation needs this field"),
      new PacingReservationRequiredRegionRule("pacing reservation needs an entry"),
      new PacingReservationRegionLengthRule(16),
    ],
  );
}
