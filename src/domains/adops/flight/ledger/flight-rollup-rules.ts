import * as text from "../../../../kit/text.js";
import { FlightRollup } from "./flight-rollup.js";

/** A rule a flight rollup must pass. Check returns its problems, or none. */
export interface FlightRollupRule {
  check(item: FlightRollup): string[];
}

export class FlightRollupCodeLengthRule implements FlightRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightRollupAllowedLocaleRule implements FlightRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

export class FlightRollupExpiresAtRangeRule implements FlightRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightRollup): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightRollupCodePrefixRule implements FlightRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a flight rollup. */
export class FlightRollupValidator {
  rules: FlightRollupRule[];

  constructor(rules: FlightRollupRule[]) {
    this.rules = rules;
  }

  validate(item: FlightRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightRollup[]): Map<string, string[]> {
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

export function defaultFlightRollupValidator(): FlightRollupValidator {
  return new FlightRollupValidator(
    [
      new FlightRollupCodeLengthRule(1000),
      new FlightRollupAllowedLocaleRule([]),
      new FlightRollupExpiresAtRangeRule(32, 86400),
      new FlightRollupCodePrefixRule("ACM"),
    ],
  );
}
