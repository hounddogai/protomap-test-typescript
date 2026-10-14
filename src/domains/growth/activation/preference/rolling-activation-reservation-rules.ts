import { RollingActivationReservation } from "./rolling-activation-reservation.js";

/** A rule a rolling activation reservation must pass. Check returns its problems, or none. */
export interface RollingActivationReservationRule {
  check(item: RollingActivationReservation): string[];
}

export class RollingActivationReservationFloorValueRangeRule implements RollingActivationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingActivationReservation): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingActivationReservationRequiredCurrencyRule implements RollingActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingActivationReservation): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class RollingActivationReservationGraceDaysRangeRule implements RollingActivationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingActivationReservation): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingActivationReservationRequiredLabelRule implements RollingActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingActivationReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingActivationReservationLabelLengthRule implements RollingActivationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingActivationReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling activation reservation. */
export class RollingActivationReservationValidator {
  rules: RollingActivationReservationRule[];

  constructor(rules: RollingActivationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RollingActivationReservation): string[] {
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

  requireValid(item: RollingActivationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingActivationReservation[]): Map<string, string[]> {
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

export function defaultRollingActivationReservationValidator(): RollingActivationReservationValidator {
  return new RollingActivationReservationValidator(
    [
      new RollingActivationReservationFloorValueRangeRule(8.7, 1677.8),
      new RollingActivationReservationRequiredCurrencyRule("rolling activation reservation needs this field"),
      new RollingActivationReservationGraceDaysRangeRule(16, 3600),
      new RollingActivationReservationRequiredLabelRule("rolling activation reservation needs a value"),
      new RollingActivationReservationLabelLengthRule(64),
    ],
  );
}
