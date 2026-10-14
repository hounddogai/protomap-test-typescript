import * as text from "../../../../kit/text.js";
import { FlightBundle } from "./flight-bundle.js";

/** A rule a flight bundle must pass. Check returns its problems, or none. */
export interface FlightBundleRule {
  check(item: FlightBundle): string[];
}

export class FlightBundleCodeLengthRule implements FlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightBundlePriorityRangeRule implements FlightBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightBundle): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightBundleCurrencyLengthRule implements FlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightBundle): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightBundleTitleLengthRule implements FlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightBundleAllowedCodeRule implements FlightBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a flight bundle. */
export class FlightBundleValidator {
  rules: FlightBundleRule[];

  constructor(rules: FlightBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FlightBundle): string[] {
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

  requireValid(item: FlightBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightBundle[]): Map<string, string[]> {
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

export function defaultFlightBundleValidator(): FlightBundleValidator {
  return new FlightBundleValidator(
    [
      new FlightBundleCodeLengthRule(86400),
      new FlightBundlePriorityRangeRule(32, 32),
      new FlightBundleCurrencyLengthRule(32),
      new FlightBundleTitleLengthRule(3600),
      new FlightBundleAllowedCodeRule(["lenient", "scheduled"]),
    ],
  );
}
