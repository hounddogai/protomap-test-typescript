import { ScheduledLevelReservation } from "./scheduled-level-reservation.js";

/** A rule a scheduled level reservation must pass. Check returns its problems, or none. */
export interface ScheduledLevelReservationRule {
  check(item: ScheduledLevelReservation): string[];
}

export class ScheduledLevelReservationRequiredCodeRule implements ScheduledLevelReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledLevelReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledLevelReservationCodePrefixRule implements ScheduledLevelReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledLevelReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledLevelReservationCodeLengthRule implements ScheduledLevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLevelReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledLevelReservationRequiredNameRule implements ScheduledLevelReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledLevelReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledLevelReservationWindowDaysRangeRule implements ScheduledLevelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledLevelReservation): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledLevelReservationDiscountRangeRule implements ScheduledLevelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledLevelReservation): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled level reservation. */
export class ScheduledLevelReservationValidator {
  rules: ScheduledLevelReservationRule[];

  constructor(rules: ScheduledLevelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledLevelReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledLevelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledLevelReservation[]): Map<string, string[]> {
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

export function defaultScheduledLevelReservationValidator(): ScheduledLevelReservationValidator {
  return new ScheduledLevelReservationValidator(
    [
      new ScheduledLevelReservationRequiredCodeRule("scheduled level reservation needs this field"),
      new ScheduledLevelReservationCodePrefixRule("X"),
      new ScheduledLevelReservationCodeLengthRule(16),
      new ScheduledLevelReservationRequiredNameRule("scheduled level reservation needs a value"),
      new ScheduledLevelReservationWindowDaysRangeRule(16, 120),
      new ScheduledLevelReservationDiscountRangeRule(0.9, 2701),
    ],
  );
}
