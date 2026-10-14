import * as text from "../../../../kit/text.js";
import { SlaReservation } from "./sla-reservation.js";

/** A rule a sla reservation must pass. Check returns its problems, or none. */
export interface SlaReservationRule {
  check(item: SlaReservation): string[];
}

export class SlaReservationRateRangeRule implements SlaReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaReservation): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaReservationRequiredLocaleRule implements SlaReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SlaReservationAllowedLocaleRule implements SlaReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

/** Runs every rule of a sla reservation. */
export class SlaReservationValidator {
  rules: SlaReservationRule[];

  constructor(rules: SlaReservationRule[]) {
    this.rules = rules;
  }

  validate(item: SlaReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaReservation[]): Map<string, string[]> {
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

export function defaultSlaReservationValidator(): SlaReservationValidator {
  return new SlaReservationValidator(
    [
      new SlaReservationRateRangeRule(9.2, 2726.4),
      new SlaReservationRequiredLocaleRule("sla reservation needs a value"),
      new SlaReservationAllowedLocaleRule(["scheduled"]),
    ],
  );
}
