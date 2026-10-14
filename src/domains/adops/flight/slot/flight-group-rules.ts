import * as text from "../../../../kit/text.js";
import { FlightGroup } from "./flight-group.js";

/** A rule a flight group must pass. Check returns its problems, or none. */
export interface FlightGroupRule {
  check(item: FlightGroup): string[];
}

export class FlightGroupApprovedGuardRule implements FlightGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FlightGroup): string[] {
    if (item.approved && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FlightGroupRatioRangeRule implements FlightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightGroup): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightGroupRequiredJourneyIdRule implements FlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightGroup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class FlightGroupAllowedLocaleRule implements FlightGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is below minimum`];
    return [];
  }
}

export class FlightGroupRetriesRangeRule implements FlightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightGroup): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightGroupRequiredCodeRule implements FlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight group. */
export class FlightGroupValidator {
  rules: FlightGroupRule[];

  constructor(rules: FlightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: FlightGroup): string[] {
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

  requireValid(item: FlightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightGroup[]): Map<string, string[]> {
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

export function defaultFlightGroupValidator(): FlightGroupValidator {
  return new FlightGroupValidator(
    [
      new FlightGroupApprovedGuardRule(4.9),
      new FlightGroupRatioRangeRule(9.1, 3926.8),
      new FlightGroupRequiredJourneyIdRule("flight group needs an entry"),
      new FlightGroupAllowedLocaleRule([]),
      new FlightGroupRetriesRangeRule(16, 255),
      new FlightGroupRequiredCodeRule("flight group needs a value"),
    ],
  );
}
