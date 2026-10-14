import { FlightSnapshot } from "./flight-snapshot.js";

/** A rule a flight snapshot must pass. Check returns its problems, or none. */
export interface FlightSnapshotRule {
  check(item: FlightSnapshot): string[];
}

export class FlightSnapshotCodeLengthRule implements FlightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightSnapshotExternalRefLengthRule implements FlightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightSnapshot): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightSnapshotDiscountRangeRule implements FlightSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightSnapshot): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightSnapshotEndsAtRangeRule implements FlightSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightSnapshot): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightSnapshotRequiredExternalRefRule implements FlightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightSnapshot): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight snapshot. */
export class FlightSnapshotValidator {
  rules: FlightSnapshotRule[];

  constructor(rules: FlightSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FlightSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightSnapshot[]): Map<string, string[]> {
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

export function defaultFlightSnapshotValidator(): FlightSnapshotValidator {
  return new FlightSnapshotValidator(
    [
      new FlightSnapshotCodeLengthRule(3600),
      new FlightSnapshotExternalRefLengthRule(64),
      new FlightSnapshotDiscountRangeRule(1.4, 3518.1),
      new FlightSnapshotEndsAtRangeRule(255, 86400),
      new FlightSnapshotRequiredExternalRefRule("flight snapshot needs a value"),
    ],
  );
}
