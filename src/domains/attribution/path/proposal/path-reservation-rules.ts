import * as text from "../../../../kit/text.js";
import { PathReservation } from "./path-reservation.js";

/** A rule a path reservation must pass. Check returns its problems, or none. */
export interface PathReservationRule {
  check(item: PathReservation): string[];
}

export class PathReservationRequiredUnitRule implements PathReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathReservation): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PathReservationAllowedDescriptionRule implements PathReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is out of range`];
    return [];
  }
}

export class PathReservationBudgetRangeRule implements PathReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathReservation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathReservationLabelLengthRule implements PathReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path reservation. */
export class PathReservationValidator {
  rules: PathReservationRule[];

  constructor(rules: PathReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PathReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathReservation[]): Map<string, string[]> {
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

export function defaultPathReservationValidator(): PathReservationValidator {
  return new PathReservationValidator(
    [
      new PathReservationRequiredUnitRule("path reservation needs a value"),
      new PathReservationAllowedDescriptionRule(["tiered"]),
      new PathReservationBudgetRangeRule(4.9, 666.4),
      new PathReservationLabelLengthRule(255),
    ],
  );
}
