import { AdaptiveEscalationReservation } from "./adaptive-escalation-reservation.js";

/** A rule a adaptive escalation reservation must pass. Check returns its problems, or none. */
export interface AdaptiveEscalationReservationRule {
  check(item: AdaptiveEscalationReservation): string[];
}

export class AdaptiveEscalationReservationCodeLengthRule implements AdaptiveEscalationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEscalationReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEscalationReservationExpiresAtRangeRule implements AdaptiveEscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveEscalationReservation): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveEscalationReservationRequiredCurrencyRule implements AdaptiveEscalationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveEscalationReservation): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveEscalationReservationCodePrefixRule implements AdaptiveEscalationReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveEscalationReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveEscalationReservationFrequencyCapRangeRule implements AdaptiveEscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveEscalationReservation): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveEscalationReservationTitleLengthRule implements AdaptiveEscalationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEscalationReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive escalation reservation. */
export class AdaptiveEscalationReservationValidator {
  rules: AdaptiveEscalationReservationRule[];

  constructor(rules: AdaptiveEscalationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveEscalationReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveEscalationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveEscalationReservation[]): Map<string, string[]> {
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

export function defaultAdaptiveEscalationReservationValidator(): AdaptiveEscalationReservationValidator {
  return new AdaptiveEscalationReservationValidator(
    [
      new AdaptiveEscalationReservationCodeLengthRule(32),
      new AdaptiveEscalationReservationExpiresAtRangeRule(16, 255),
      new AdaptiveEscalationReservationRequiredCurrencyRule("adaptive escalation reservation needs this field"),
      new AdaptiveEscalationReservationCodePrefixRule("REF"),
      new AdaptiveEscalationReservationFrequencyCapRangeRule(16, 1000),
      new AdaptiveEscalationReservationTitleLengthRule(255),
    ],
  );
}
