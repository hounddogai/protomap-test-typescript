import * as text from "../../../../kit/text.js";
import { ManualDeflectionReservation } from "./manual-deflection-reservation.js";

/** A rule a manual deflection reservation must pass. Check returns its problems, or none. */
export interface ManualDeflectionReservationRule {
  check(item: ManualDeflectionReservation): string[];
}

export class ManualDeflectionReservationRequiredVariantRule implements ManualDeflectionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualDeflectionReservation): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ManualDeflectionReservationAllowedExternalRefRule implements ManualDeflectionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualDeflectionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is stale`];
    return [];
  }
}

export class ManualDeflectionReservationCodeLengthRule implements ManualDeflectionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualDeflectionReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual deflection reservation. */
export class ManualDeflectionReservationValidator {
  rules: ManualDeflectionReservationRule[];

  constructor(rules: ManualDeflectionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualDeflectionReservation): string[] {
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

  requireValid(item: ManualDeflectionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualDeflectionReservation[]): Map<string, string[]> {
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

export function defaultManualDeflectionReservationValidator(): ManualDeflectionReservationValidator {
  return new ManualDeflectionReservationValidator(
    [
      new ManualDeflectionReservationRequiredVariantRule("manual deflection reservation needs an entry"),
      new ManualDeflectionReservationAllowedExternalRefRule([]),
      new ManualDeflectionReservationCodeLengthRule(32),
    ],
  );
}
