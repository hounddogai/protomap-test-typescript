import { FlightClaim } from "./flight-claim.js";

/** A rule a flight claim must pass. Check returns its problems, or none. */
export interface FlightClaimRule {
  check(item: FlightClaim): string[];
}

export class FlightClaimLabelLengthRule implements FlightClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightClaimCodeLengthRule implements FlightClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightClaimScoreRangeRule implements FlightClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightClaim): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightClaimRequiredSourceRule implements FlightClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightClaim): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight claim. */
export class FlightClaimValidator {
  rules: FlightClaimRule[];

  constructor(rules: FlightClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FlightClaim): string[] {
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

  requireValid(item: FlightClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightClaim[]): Map<string, string[]> {
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

export function defaultFlightClaimValidator(): FlightClaimValidator {
  return new FlightClaimValidator(
    [
      new FlightClaimLabelLengthRule(80),
      new FlightClaimCodeLengthRule(64),
      new FlightClaimScoreRangeRule(8.6, 1753),
      new FlightClaimRequiredSourceRule("flight claim needs this field"),
    ],
  );
}
