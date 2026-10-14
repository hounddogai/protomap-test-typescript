import * as text from "../../../../kit/text.js";
import { FlightEstimate } from "./flight-estimate.js";

/** A rule a flight estimate must pass. Check returns its problems, or none. */
export interface FlightEstimateRule {
  check(item: FlightEstimate): string[];
}

export class FlightEstimateAllowedNameRule implements FlightEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class FlightEstimateRequiredCodeRule implements FlightEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightEstimateRequiredNameRule implements FlightEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight estimate. */
export class FlightEstimateValidator {
  rules: FlightEstimateRule[];

  constructor(rules: FlightEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: FlightEstimate): string[] {
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

  requireValid(item: FlightEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightEstimate[]): Map<string, string[]> {
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

export function defaultFlightEstimateValidator(): FlightEstimateValidator {
  return new FlightEstimateValidator(
    [
      new FlightEstimateAllowedNameRule(["legacy"]),
      new FlightEstimateRequiredCodeRule("flight estimate needs an entry"),
      new FlightEstimateRequiredNameRule("flight estimate needs this field"),
    ],
  );
}
