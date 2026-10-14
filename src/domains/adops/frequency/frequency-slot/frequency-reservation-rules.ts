import { FrequencyReservation } from "./frequency-reservation.js";

/** A rule a frequency reservation must pass. Check returns its problems, or none. */
export interface FrequencyReservationRule {
  check(item: FrequencyReservation): string[];
}

export class FrequencyReservationCodePrefixRule implements FrequencyReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyReservationCodeLengthRule implements FrequencyReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyReservationNameLengthRule implements FrequencyReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyReservationOpenRateRangeRule implements FrequencyReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyReservation): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a frequency reservation. */
export class FrequencyReservationValidator {
  rules: FrequencyReservationRule[];

  constructor(rules: FrequencyReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyReservation[]): Map<string, string[]> {
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

export function defaultFrequencyReservationValidator(): FrequencyReservationValidator {
  return new FrequencyReservationValidator(
    [
      new FrequencyReservationCodePrefixRule("ACM"),
      new FrequencyReservationCodeLengthRule(255),
      new FrequencyReservationNameLengthRule(255),
      new FrequencyReservationOpenRateRangeRule(2.1, 4235.6),
    ],
  );
}
