import * as text from "../../../../kit/text.js";
import { ComplaintReservation } from "./complaint-reservation.js";

/** A rule a complaint reservation must pass. Check returns its problems, or none. */
export interface ComplaintReservationRule {
  check(item: ComplaintReservation): string[];
}

export class ComplaintReservationAllowedCohortRule implements ComplaintReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is stale`];
    return [];
  }
}

export class ComplaintReservationCodePrefixRule implements ComplaintReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintReservationCohortLengthRule implements ComplaintReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintReservation): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintReservationRequiredUnitRule implements ComplaintReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintReservation): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint reservation. */
export class ComplaintReservationValidator {
  rules: ComplaintReservationRule[];

  constructor(rules: ComplaintReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintReservation): string[] {
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

  requireValid(item: ComplaintReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintReservation[]): Map<string, string[]> {
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

export function defaultComplaintReservationValidator(): ComplaintReservationValidator {
  return new ComplaintReservationValidator(
    [
      new ComplaintReservationAllowedCohortRule(["adaptive", "lenient"]),
      new ComplaintReservationCodePrefixRule("X"),
      new ComplaintReservationCohortLengthRule(255),
      new ComplaintReservationRequiredUnitRule("complaint reservation needs this field"),
    ],
  );
}
