import { LenientDeflectionReservation } from "./lenient-deflection-reservation.js";

/** A rule a lenient deflection reservation must pass. Check returns its problems, or none. */
export interface LenientDeflectionReservationRule {
  check(item: LenientDeflectionReservation): string[];
}

export class LenientDeflectionReservationRequiredCategoryRule implements LenientDeflectionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionReservation): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionReservationCodePrefixRule implements LenientDeflectionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientDeflectionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientDeflectionReservationCategoryLengthRule implements LenientDeflectionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionReservation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient deflection reservation. */
export class LenientDeflectionReservationValidator {
  rules: LenientDeflectionReservationRule[];

  constructor(rules: LenientDeflectionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDeflectionReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientDeflectionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDeflectionReservation[]): Map<string, string[]> {
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

export function defaultLenientDeflectionReservationValidator(): LenientDeflectionReservationValidator {
  return new LenientDeflectionReservationValidator(
    [
      new LenientDeflectionReservationRequiredCategoryRule("lenient deflection reservation needs an entry"),
      new LenientDeflectionReservationCodePrefixRule("OPS"),
      new LenientDeflectionReservationCategoryLengthRule(1000),
    ],
  );
}
