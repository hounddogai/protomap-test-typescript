import * as text from "../../../../kit/text.js";
import { PaywallReservation } from "./paywall-reservation.js";

/** A rule a paywall reservation must pass. Check returns its problems, or none. */
export interface PaywallReservationRule {
  check(item: PaywallReservation): string[];
}

export class PaywallReservationCodePrefixRule implements PaywallReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallReservationFrequencyCapRangeRule implements PaywallReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallReservation): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallReservationCodeLengthRule implements PaywallReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallReservationAllowedTitleRule implements PaywallReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class PaywallReservationNameLengthRule implements PaywallReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a paywall reservation. */
export class PaywallReservationValidator {
  rules: PaywallReservationRule[];

  constructor(rules: PaywallReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallReservation[]): Map<string, string[]> {
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

export function defaultPaywallReservationValidator(): PaywallReservationValidator {
  return new PaywallReservationValidator(
    [
      new PaywallReservationCodePrefixRule("REF"),
      new PaywallReservationFrequencyCapRangeRule(120, 255),
      new PaywallReservationCodeLengthRule(120),
      new PaywallReservationAllowedTitleRule([]),
      new PaywallReservationNameLengthRule(80),
    ],
  );
}
