import * as text from "../../../../kit/text.js";
import { WarmupReservation } from "./warmup-reservation.js";

/** A rule a warmup reservation must pass. Check returns its problems, or none. */
export interface WarmupReservationRule {
  check(item: WarmupReservation): string[];
}

export class WarmupReservationAllowedCategoryRule implements WarmupReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is above maximum`];
    return [];
  }
}

export class WarmupReservationRequiredDescriptionRule implements WarmupReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupReservation): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupReservationUnitLengthRule implements WarmupReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupReservation): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupReservationDescriptionLengthRule implements WarmupReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupReservation): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup reservation. */
export class WarmupReservationValidator {
  rules: WarmupReservationRule[];

  constructor(rules: WarmupReservationRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupReservation): string[] {
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

  requireValid(item: WarmupReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupReservation[]): Map<string, string[]> {
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

export function defaultWarmupReservationValidator(): WarmupReservationValidator {
  return new WarmupReservationValidator(
    [
      new WarmupReservationAllowedCategoryRule(["manual", "manual"]),
      new WarmupReservationRequiredDescriptionRule("warmup reservation needs an entry"),
      new WarmupReservationUnitLengthRule(80),
      new WarmupReservationDescriptionLengthRule(32),
    ],
  );
}
