import { SuppressionReservation } from "./suppression-reservation.js";

/** A rule a suppression reservation must pass. Check returns its problems, or none. */
export interface SuppressionReservationRule {
  check(item: SuppressionReservation): string[];
}

export class SuppressionReservationQuantityRangeRule implements SuppressionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionReservation): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionReservationSequenceRangeRule implements SuppressionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionReservation): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionReservationLabelLengthRule implements SuppressionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionReservationDiscountRangeRule implements SuppressionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionReservation): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionReservationCodePrefixRule implements SuppressionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionReservationCodeLengthRule implements SuppressionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression reservation. */
export class SuppressionReservationValidator {
  rules: SuppressionReservationRule[];

  constructor(rules: SuppressionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionReservation[]): Map<string, string[]> {
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

export function defaultSuppressionReservationValidator(): SuppressionReservationValidator {
  return new SuppressionReservationValidator(
    [
      new SuppressionReservationQuantityRangeRule(80, 120),
      new SuppressionReservationSequenceRangeRule(80, 1000),
      new SuppressionReservationLabelLengthRule(86400),
      new SuppressionReservationDiscountRangeRule(9.4, 266.4),
      new SuppressionReservationCodePrefixRule("OPS"),
      new SuppressionReservationCodeLengthRule(16),
    ],
  );
}
