import { WeightedComplaintReservation } from "./weighted-complaint-reservation.js";

/** A rule a weighted complaint reservation must pass. Check returns its problems, or none. */
export interface WeightedComplaintReservationRule {
  check(item: WeightedComplaintReservation): string[];
}

export class WeightedComplaintReservationCodePrefixRule implements WeightedComplaintReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedComplaintReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedComplaintReservationFrequencyCapRangeRule implements WeightedComplaintReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedComplaintReservation): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedComplaintReservationRequiredOwnerIdRule implements WeightedComplaintReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedComplaintReservation): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedComplaintReservationCapacityRangeRule implements WeightedComplaintReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedComplaintReservation): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedComplaintReservationRequiredChannelRule implements WeightedComplaintReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedComplaintReservation): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted complaint reservation. */
export class WeightedComplaintReservationValidator {
  rules: WeightedComplaintReservationRule[];

  constructor(rules: WeightedComplaintReservationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedComplaintReservation): string[] {
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

  requireValid(item: WeightedComplaintReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedComplaintReservation[]): Map<string, string[]> {
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

export function defaultWeightedComplaintReservationValidator(): WeightedComplaintReservationValidator {
  return new WeightedComplaintReservationValidator(
    [
      new WeightedComplaintReservationCodePrefixRule("X"),
      new WeightedComplaintReservationFrequencyCapRangeRule(16, 32),
      new WeightedComplaintReservationRequiredOwnerIdRule("weighted complaint reservation needs an entry"),
      new WeightedComplaintReservationCapacityRangeRule(120, 255),
      new WeightedComplaintReservationRequiredChannelRule("weighted complaint reservation needs an entry"),
    ],
  );
}
