import * as text from "../../../../kit/text.js";
import { FlightProfile } from "./flight-profile.js";

/** A rule a flight profile must pass. Check returns its problems, or none. */
export interface FlightProfileRule {
  check(item: FlightProfile): string[];
}

export class FlightProfileRequiredRegionRule implements FlightProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightProfile): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class FlightProfileTitleLengthRule implements FlightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightProfileAllowedNameRule implements FlightProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class FlightProfileRequiredCodeRule implements FlightProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight profile. */
export class FlightProfileValidator {
  rules: FlightProfileRule[];

  constructor(rules: FlightProfileRule[]) {
    this.rules = rules;
  }

  validate(item: FlightProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightProfile[]): Map<string, string[]> {
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

export function defaultFlightProfileValidator(): FlightProfileValidator {
  return new FlightProfileValidator(
    [
      new FlightProfileRequiredRegionRule("flight profile needs a value"),
      new FlightProfileTitleLengthRule(1000),
      new FlightProfileAllowedNameRule(["tiered", "global"]),
      new FlightProfileRequiredCodeRule("flight profile needs an entry"),
    ],
  );
}
