import { LegacyPayoutReservation } from "./legacy-payout-reservation.js";

/** A rule a legacy payout reservation must pass. Check returns its problems, or none. */
export interface LegacyPayoutReservationRule {
  check(item: LegacyPayoutReservation): string[];
}

export class LegacyPayoutReservationRequiredNameRule implements LegacyPayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPayoutReservationCodeLengthRule implements LegacyPayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutReservationConversionRateRangeRule implements LegacyPayoutReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPayoutReservation): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyPayoutReservationCodePrefixRule implements LegacyPayoutReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyPayoutReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyPayoutReservationNameLengthRule implements LegacyPayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutReservationRequiredCodeRule implements LegacyPayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy payout reservation. */
export class LegacyPayoutReservationValidator {
  rules: LegacyPayoutReservationRule[];

  constructor(rules: LegacyPayoutReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPayoutReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPayoutReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPayoutReservation[]): Map<string, string[]> {
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

export function defaultLegacyPayoutReservationValidator(): LegacyPayoutReservationValidator {
  return new LegacyPayoutReservationValidator(
    [
      new LegacyPayoutReservationRequiredNameRule("legacy payout reservation needs this field"),
      new LegacyPayoutReservationCodeLengthRule(86400),
      new LegacyPayoutReservationConversionRateRangeRule(3, 1720.5),
      new LegacyPayoutReservationCodePrefixRule("Q"),
      new LegacyPayoutReservationNameLengthRule(120),
      new LegacyPayoutReservationRequiredCodeRule("legacy payout reservation needs a value"),
    ],
  );
}
