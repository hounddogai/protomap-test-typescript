import * as text from "../../../../kit/text.js";
import { FallbackModelReservation } from "./fallback-model-reservation.js";

/** A rule a fallback model reservation must pass. Check returns its problems, or none. */
export interface FallbackModelReservationRule {
  check(item: FallbackModelReservation): string[];
}

export class FallbackModelReservationMarginRangeRule implements FallbackModelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackModelReservation): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackModelReservationCodeLengthRule implements FallbackModelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackModelReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackModelReservationAllowedCodeRule implements FallbackModelReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackModelReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class FallbackModelReservationRequiredLabelRule implements FallbackModelReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackModelReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackModelReservationCodePrefixRule implements FallbackModelReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackModelReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback model reservation. */
export class FallbackModelReservationValidator {
  rules: FallbackModelReservationRule[];

  constructor(rules: FallbackModelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackModelReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackModelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackModelReservation[]): Map<string, string[]> {
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

export function defaultFallbackModelReservationValidator(): FallbackModelReservationValidator {
  return new FallbackModelReservationValidator(
    [
      new FallbackModelReservationMarginRangeRule(3.1, 90.8),
      new FallbackModelReservationCodeLengthRule(16),
      new FallbackModelReservationAllowedCodeRule(["seasonal"]),
      new FallbackModelReservationRequiredLabelRule("fallback model reservation needs an entry"),
      new FallbackModelReservationCodePrefixRule("REF"),
    ],
  );
}
