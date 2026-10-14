import * as text from "../../../../kit/text.js";
import { FlightEntry } from "./flight-entry.js";

/** A rule a flight entry must pass. Check returns its problems, or none. */
export interface FlightEntryRule {
  check(item: FlightEntry): string[];
}

export class FlightEntryRequiredVariantRule implements FlightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightEntry): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class FlightEntryRequiredLabelRule implements FlightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FlightEntryAllowedLabelRule implements FlightEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class FlightEntryRequiredCodeRule implements FlightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight entry. */
export class FlightEntryValidator {
  rules: FlightEntryRule[];

  constructor(rules: FlightEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FlightEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightEntry[]): Map<string, string[]> {
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

export function defaultFlightEntryValidator(): FlightEntryValidator {
  return new FlightEntryValidator(
    [
      new FlightEntryRequiredVariantRule("flight entry needs an entry"),
      new FlightEntryRequiredLabelRule("flight entry needs a value"),
      new FlightEntryAllowedLabelRule([]),
      new FlightEntryRequiredCodeRule("flight entry needs a value"),
    ],
  );
}
