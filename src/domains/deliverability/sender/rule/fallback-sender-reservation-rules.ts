import { FallbackSenderReservation } from "./fallback-sender-reservation.js";

/** A rule a fallback sender reservation must pass. Check returns its problems, or none. */
export interface FallbackSenderReservationRule {
  check(item: FallbackSenderReservation): string[];
}

export class FallbackSenderReservationCodeLengthRule implements FallbackSenderReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSenderReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSenderReservationRequiredCurrencyRule implements FallbackSenderReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderReservation): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSenderReservationCurrencyLengthRule implements FallbackSenderReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSenderReservation): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSenderReservationChannelLengthRule implements FallbackSenderReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSenderReservation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSenderReservationRequiredCodeRule implements FallbackSenderReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback sender reservation. */
export class FallbackSenderReservationValidator {
  rules: FallbackSenderReservationRule[];

  constructor(rules: FallbackSenderReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSenderReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSenderReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSenderReservation[]): Map<string, string[]> {
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

export function defaultFallbackSenderReservationValidator(): FallbackSenderReservationValidator {
  return new FallbackSenderReservationValidator(
    [
      new FallbackSenderReservationCodeLengthRule(86400),
      new FallbackSenderReservationRequiredCurrencyRule("fallback sender reservation needs this field"),
      new FallbackSenderReservationCurrencyLengthRule(64),
      new FallbackSenderReservationChannelLengthRule(16),
      new FallbackSenderReservationRequiredCodeRule("fallback sender reservation needs a value"),
    ],
  );
}
