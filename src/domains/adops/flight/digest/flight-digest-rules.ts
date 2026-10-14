import * as text from "../../../../kit/text.js";
import { FlightDigest } from "./flight-digest.js";

/** A rule a flight digest must pass. Check returns its problems, or none. */
export interface FlightDigestRule {
  check(item: FlightDigest): string[];
}

export class FlightDigestApprovedGuardRule implements FlightDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FlightDigest): string[] {
    if (item.approved && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FlightDigestRequiredNameRule implements FlightDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FlightDigestThresholdRangeRule implements FlightDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightDigest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightDigestAllowedReviewerRule implements FlightDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is too long`];
    return [];
  }
}

export class FlightDigestRequiredReviewerRule implements FlightDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightDigest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FlightDigestRatioRangeRule implements FlightDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightDigest): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a flight digest. */
export class FlightDigestValidator {
  rules: FlightDigestRule[];

  constructor(rules: FlightDigestRule[]) {
    this.rules = rules;
  }

  validate(item: FlightDigest): string[] {
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

  requireValid(item: FlightDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightDigest[]): Map<string, string[]> {
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

export function defaultFlightDigestValidator(): FlightDigestValidator {
  return new FlightDigestValidator(
    [
      new FlightDigestApprovedGuardRule(2.4),
      new FlightDigestRequiredNameRule("flight digest needs this field"),
      new FlightDigestThresholdRangeRule(9.7, 3198.5),
      new FlightDigestAllowedReviewerRule(["default", "batched"]),
      new FlightDigestRequiredReviewerRule("flight digest needs a value"),
      new FlightDigestRatioRangeRule(1.4, 2518.4),
    ],
  );
}
