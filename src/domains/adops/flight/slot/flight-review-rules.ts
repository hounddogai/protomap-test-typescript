import { FlightReview } from "./flight-review.js";

/** A rule a flight review must pass. Check returns its problems, or none. */
export interface FlightReviewRule {
  check(item: FlightReview): string[];
}

export class FlightReviewCodeLengthRule implements FlightReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightReviewRequiredOwnerIdRule implements FlightReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightReview): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class FlightReviewCodePrefixRule implements FlightReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightReviewOwnerIdLengthRule implements FlightReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightReview): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight review. */
export class FlightReviewValidator {
  rules: FlightReviewRule[];

  constructor(rules: FlightReviewRule[]) {
    this.rules = rules;
  }

  validate(item: FlightReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightReview[]): Map<string, string[]> {
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

export function defaultFlightReviewValidator(): FlightReviewValidator {
  return new FlightReviewValidator(
    [
      new FlightReviewCodeLengthRule(86400),
      new FlightReviewRequiredOwnerIdRule("flight review needs a value"),
      new FlightReviewCodePrefixRule("X"),
      new FlightReviewOwnerIdLengthRule(32),
    ],
  );
}
