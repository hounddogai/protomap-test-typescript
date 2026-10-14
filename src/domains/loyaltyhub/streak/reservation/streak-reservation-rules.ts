import { StreakReservation } from "./streak-reservation.js";

/** A rule a streak reservation must pass. Check returns its problems, or none. */
export interface StreakReservationRule {
  check(item: StreakReservation): string[];
}

export class StreakReservationBudgetRangeRule implements StreakReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakReservation): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakReservationRequiredLabelRule implements StreakReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StreakReservationCodePrefixRule implements StreakReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakReservationQuantityRangeRule implements StreakReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakReservation): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakReservationConversionRateRangeRule implements StreakReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakReservation): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakReservationCodeLengthRule implements StreakReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak reservation. */
export class StreakReservationValidator {
  rules: StreakReservationRule[];

  constructor(rules: StreakReservationRule[]) {
    this.rules = rules;
  }

  validate(item: StreakReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakReservation[]): Map<string, string[]> {
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

export function defaultStreakReservationValidator(): StreakReservationValidator {
  return new StreakReservationValidator(
    [
      new StreakReservationBudgetRangeRule(2, 4448.6),
      new StreakReservationRequiredLabelRule("streak reservation needs this field"),
      new StreakReservationCodePrefixRule("X"),
      new StreakReservationQuantityRangeRule(64, 86400),
      new StreakReservationConversionRateRangeRule(0.7, 1995),
      new StreakReservationCodeLengthRule(255),
    ],
  );
}
