import { LegacyWaitReservation } from "./legacy-wait-reservation.js";

/** A rule a legacy wait reservation must pass. Check returns its problems, or none. */
export interface LegacyWaitReservationRule {
  check(item: LegacyWaitReservation): string[];
}

export class LegacyWaitReservationUtmSourceLengthRule implements LegacyWaitReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWaitReservation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWaitReservationRetriesRangeRule implements LegacyWaitReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitReservation): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyWaitReservationRequiredCodeRule implements LegacyWaitReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWaitReservationRateRangeRule implements LegacyWaitReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitReservation): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyWaitReservationFloorValueRangeRule implements LegacyWaitReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitReservation): string[] {
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

export class LegacyWaitReservationRequiredTitleRule implements LegacyWaitReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy wait reservation. */
export class LegacyWaitReservationValidator {
  rules: LegacyWaitReservationRule[];

  constructor(rules: LegacyWaitReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWaitReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWaitReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWaitReservation[]): Map<string, string[]> {
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

export function defaultLegacyWaitReservationValidator(): LegacyWaitReservationValidator {
  return new LegacyWaitReservationValidator(
    [
      new LegacyWaitReservationUtmSourceLengthRule(255),
      new LegacyWaitReservationRetriesRangeRule(120, 86400),
      new LegacyWaitReservationRequiredCodeRule("legacy wait reservation needs a value"),
      new LegacyWaitReservationRateRangeRule(8.4, 1989.3),
      new LegacyWaitReservationFloorValueRangeRule(1, 883.9),
      new LegacyWaitReservationRequiredTitleRule("legacy wait reservation needs an entry"),
    ],
  );
}
